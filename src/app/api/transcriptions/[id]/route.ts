import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const transcription = await prisma.transcription.findUnique({
      where: { id },
      include: {
        segments: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!transcription) {
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 });
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error('Failed to fetch transcription:', error);
    return NextResponse.json({ error: 'Failed to fetch transcription' }, { status: 500 });
  }
}
