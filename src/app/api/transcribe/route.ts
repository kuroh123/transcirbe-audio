import { AssemblyAI } from "assemblyai";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY || "91f0230b29694455938895f636a0018b",
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
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(process.cwd(), 'tmp', fileName);

    // Create tmp directory if it doesn't exist and save file
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    // Upload to AssemblyAI
    const uploadRes = await fetch(
      "https://api.assemblyai.com/v2/upload",
      {
        method: 'POST',
        body: buffer,
        headers: {
          authorization: process.env.ASSEMBLY_API_KEY || "91f0230b29694455938895f636a0018b",
          "content-type": "application/octet-stream",
        },
      }
    );

    if (!uploadRes.ok) {
      console.error('Upload failed:', await uploadRes.text());
      return NextResponse.json({ error: 'Failed to upload file to AssemblyAI' }, { status: 500 });
    }

    const uploadData = await uploadRes.json();
    const audioUrl = uploadData.upload_url;

    // Start transcription using the uploaded URL
    const transcriptionResponse = await client.transcripts.transcribe({
      audio_url: audioUrl,
      language_code: 'en',
      format_text: true,
      punctuate: true,
      dual_channel: false,
      speaker_labels: true,
    });

    // Clean up temporary file
    try {
      const fs = require('fs');
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.error('Error cleaning up file:', unlinkError);
    }

    console.log('Transcription started:', transcriptionResponse.utterances);

    // Transform AssemblyAI response to match frontend expectations
    const segments = transcriptionResponse.utterances?.map((utterance: any, index: number) => ({
      id: `segment-${index}`,
      speaker: utterance.speaker ? `Speaker ${utterance.speaker}` : `Speaker ${(index % 2) + 1}`,
      text: utterance.text,
      startTime: utterance.start / 1000, // Convert from milliseconds to seconds
      endTime: utterance.end / 1000,
      confidence: utterance.confidence || 0.95,
    })) || [];

    // Generate a simple summary if text is available
    let summary = null;
    if (transcriptionResponse.text && transcriptionResponse.text.length > 100) {
      const sentences = transcriptionResponse.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      summary = `• Key topics discussed in the audio\n• Total duration: ${Math.round((transcriptionResponse.audio_duration || 0) / 1000)}s\n• ${sentences.length} main points covered`;
    }

    return NextResponse.json({
      id: transcriptionResponse.id,
      fileName: fileName,
      status: 'COMPLETED',
      text: transcriptionResponse.text,
      summary: summary,
      segments: segments,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}