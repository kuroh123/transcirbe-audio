import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcriptionId, question } = await request.json();

    if (!transcriptionId || !question) {
      return NextResponse.json({ error: 'Missing transcriptionId or question' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Get the transcription from database
    const transcription = await prisma.transcription.findUnique({
      where: { id: transcriptionId },
      include: { segments: true },
    });

    if (!transcription || !transcription.text) {
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 });
    }

    // Generate answer using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions about transcribed audio content. Provide accurate, concise answers based only on the information in the transcript. Any other questions unrelated to the transcript will not be answered.',
        },
        {
          role: 'user',
          content: `Please answer this question based on the following transcript:\n\nQuestion: ${question}\n\nTranscript: ${transcription.text}`,
        },
      ],
      max_tokens: 400,
    });

    const answer = response.choices[0]?.message?.content || 'I could not generate an answer to your question.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Question answering error:', error);
    return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 });
  }
}
