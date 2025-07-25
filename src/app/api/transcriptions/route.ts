export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const transcriptions = await prisma.transcription.findMany({
      include: {
        segments: {
          take: 1, // Just get the first segment for preview
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(transcriptions);
  } catch (error) {
    console.error('Failed to fetch transcriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch transcriptions' }, { status: 500 });
  }
}
