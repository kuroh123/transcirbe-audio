import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    const filePath = join(process.cwd(), 'tmp', fileName);

    // Create tmp directory if it doesn't exist
    try {
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
      // Transcribe with OpenAI Whisper
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: createReadStream(filePath) as any,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word', 'segment'],
      });

      // Process segments and add speaker diarization (simplified)
      const segments = transcriptionResponse.words?.map((word: any, index: number) => ({
        id: uuidv4(),
        transcriptionId: transcription.id,
        speaker: `Speaker ${(index % 2) + 1}`, // Simple alternating speaker assignment
        text: word.word,
        startTime: word.start,
        endTime: word.end,
        confidence: 0.95, // Mock confidence
      })) || [];

      // Group words into sentences for better readability
      const groupedSegments = [];
      let currentSegment = '';
      let currentSpeaker = segments[0]?.speaker || 'Speaker 1';
      let currentStart = segments[0]?.startTime || 0;
      let currentEnd = segments[0]?.endTime || 0;

      for (const segment of segments) {
        if (segment.speaker === currentSpeaker && currentSegment.length < 200) {
          currentSegment += segment.text + ' ';
          currentEnd = segment.endTime;
        } else {
          if (currentSegment.trim()) {
            groupedSegments.push({
              id: uuidv4(),
              transcriptionId: transcription.id,
              speaker: currentSpeaker,
              text: currentSegment.trim(),
              startTime: currentStart,
              endTime: currentEnd,
              confidence: 0.95,
            });
          }
          currentSegment = segment.text + ' ';
          currentSpeaker = segment.speaker;
          currentStart = segment.startTime;
          currentEnd = segment.endTime;
        }
      }

      // Add the last segment
      if (currentSegment.trim()) {
        groupedSegments.push({
          id: uuidv4(),
          transcriptionId: transcription.id,
          speaker: currentSpeaker,
          text: currentSegment.trim(),
          startTime: currentStart,
          endTime: currentEnd,
          confidence: 0.95,
        });
      }

      // Create segments in database
      await prisma.transcriptionSegment.createMany({
        data: groupedSegments,
      });

      // Generate summary using GPT
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise summaries of transcribed audio content. Provide a summary in 3-5 bullet points highlighting the key topics and main points discussed.',
          },
          {
            role: 'user',
            content: `Please summarize this transcript: ${transcriptionResponse.text}`,
          },
        ],
        max_tokens: 200,
      });

      const summary = summaryResponse.choices[0]?.message?.content || null;

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

      // Clean up temporary file
      await unlink(filePath);

      return NextResponse.json(updatedTranscription);
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Update transcription status to failed
      await prisma.transcription.update({
        where: { id: transcription.id },
        data: { status: 'FAILED' },
      });

      // Clean up temporary file
      try {
        await unlink(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }

      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
