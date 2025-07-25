import { AssemblyAI } from "assemblyai";
import { writeFile, unlink, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const assemblyClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY || "",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const userPrompt = formData.get('userPrompt') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    if (!process.env.ASSEMBLY_API_KEY) {
      console.error('ASSEMBLY_API_KEY is not configured');
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${uuidv4()}-${file.name}`;
    const tmpDir = join(process.cwd(), 'tmp');
    const filePath = join(tmpDir, fileName);

    // Create tmp directory if it doesn't exist and save file
    try {
      await mkdir(tmpDir, { recursive: true });
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    // Create transcription record in database
    const transcription = await prisma.transcription.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: 'PROCESSING',
      },
    });

    try {
      // Upload to AssemblyAI with timeout and better error handling
      console.log('Starting transcription with local file...');
      
      // Comment out the upload method - use file directly instead
      // const controller = new AbortController();
      // const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // const uploadRes = await fetch(
      //   "https://api.assemblyai.com/v2/upload/",
      //   {
      //     method: 'POST',
      //     body: buffer,
      //     headers: {
      //     authorization: process.env.ASSEMBLY_API_KEY || "91f0230b29694455938895f636a0018b",
      //       "content-type": "application/octet-stream",
      //     },
      //   }
      // );

      // clearTimeout(timeoutId);

      // if (!uploadRes.ok) {
      //   const errorText = await uploadRes.text();
      //   console.error('AssemblyAI upload failed:', uploadRes.status, errorText);
      //   throw new Error(`AssemblyAI upload failed: ${uploadRes.status} - ${errorText}`);
      // }

      // const uploadData = await uploadRes.json();
      // const audioUrl = uploadData.upload_url;
      // console.log('Upload successful, starting transcription...');

      // Start transcription using the local file directly
      const transcriptionResponse = await assemblyClient.transcripts.transcribe({
        audio: filePath, // Use local file path instead of uploaded URL
        language_code: 'en',
        format_text: true,
        punctuate: true,
        dual_channel: false,
        speaker_labels: true,
      });

      console.log('Transcription completed successfully');

      // Clean up temporary file
      try {
        await unlink(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }

      // Transform AssemblyAI utterances to segments for database
      const segments = transcriptionResponse.utterances?.map((utterance: any, index: number) => ({
        id: uuidv4(),
        transcriptionId: transcription.id,
        speaker: utterance.speaker ? `Speaker ${utterance.speaker}` : `Speaker ${(index % 2) + 1}`,
        text: utterance.text,
        startTime: utterance.start / 1000, // Convert from milliseconds to seconds
        endTime: utterance.end / 1000,
        confidence: utterance.confidence || 0.95,
      })) || [];

      // Create segments in database
      await prisma.transcriptionSegment.createMany({
        data: segments,
      });

      // Generate summary using OpenAI GPT
      let summary = null;
      if (transcriptionResponse.text) {
        try {
          const summaryPrompt = userPrompt ? 
            `Please summarize this transcript and also answer this question: "${userPrompt}"\n\nTranscript: ${transcriptionResponse.text}` :
            `Please create a concise summary of this transcript in 3-5 bullet points highlighting the key topics and main points discussed.\n\nTranscript: ${transcriptionResponse.text}. 
            Any other questions unrelated to the transcript will not be answered.`;

          const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that creates concise summaries of transcribed audio content.',
              },
              {
                role: 'user',
                content: summaryPrompt,
              },
            ],
            max_tokens: 300,
          });

          summary = summaryResponse.choices[0]?.message?.content || null;
        } catch (summaryError) {
          console.error('Summary generation failed:', summaryError);
          // Continue without summary
        }
      }

      // Update transcription with results
      const updatedTranscription = await prisma.transcription.update({
        where: { id: transcription.id },
        data: {
          text: transcriptionResponse.text,
          summary: summary,
          status: 'COMPLETED',
        },
        include: {
          segments: true,
        },
      });

      return NextResponse.json(updatedTranscription);
    } catch (error) {
      console.error('Transcription error:', error);
      
      let errorMessage = 'Transcription failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again';
        } else if (error.message.includes('fetch failed')) {
          errorMessage = 'Network connection failed - please check your internet connection and try again';
        } else if (error.message.includes('AssemblyAI')) {
          errorMessage = error.message;
        } else {
          errorMessage = `Transcription failed: ${error.message}`;
        }
      }
      
      // Update transcription status to failed
      await prisma.transcription.update({
        where: { id: transcription.id },
        data: { 
          status: 'FAILED',
          summary: `Error: ${errorMessage}` 
        },
      });

      // Clean up temporary file
      try {
        await unlink(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}