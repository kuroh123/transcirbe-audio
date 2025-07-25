import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const format = searchParams.get('format') as 'txt' | 'pdf';

  if (!id || !format) {
    return NextResponse.json({ error: 'Missing id or format parameter' }, { status: 400 });
  }

  try {
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      include: { segments: true },
    });

    if (!transcription) {
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 });
    }

    if (format === 'txt') {
      return generateTxtFile(transcription);
    } else if (format === 'pdf') {
      return await generatePdfFile(transcription);
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function generateTxtFile(transcription: any) {
  let content = `Transcription: ${transcription.originalName}\n`;
  content += `Date: ${new Date(transcription.createdAt).toLocaleDateString()}\n`;
  content += `Duration: ${formatDuration(transcription.segments)}\n\n`;

  if (transcription.summary) {
    content += `SUMMARY:\n${transcription.summary}\n\n`;
  }

  content += `TRANSCRIPT:\n\n`;

  transcription.segments.forEach((segment: any) => {
    const timestamp = formatTime(segment.startTime);
    const speaker = segment.speaker ? `[${segment.speaker}] ` : '';
    content += `${timestamp} ${speaker}${segment.text}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain' });
  
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${transcription.originalName}.txt"`,
    },
  });
}

async function generatePdfFile(transcription: any) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Helper function to add text with line wrapping
  const addText = (text: string, fontSize: number, fontType: any, color = rgb(0, 0, 0)) => {
    const maxWidth = width - 2 * margin;
    const words = text.split(' ');
    let line = '';
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = fontType.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth > maxWidth && line) {
        // Draw the current line
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: fontType,
          color,
        });
        yPosition -= fontSize + 5;
        line = word;
        
        // Check if we need a new page
        if (yPosition < margin) {
          page = pdfDoc.addPage();
          yPosition = height - margin;
        }
      } else {
        line = testLine;
      }
    }
    
    // Draw the remaining line
    if (line) {
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: fontType,
        color,
      });
      yPosition -= fontSize + 5;
    }
    
    return yPosition;
  };

  // Title
  yPosition = addText(`Transcription: ${transcription.originalName}`, 16, boldFont);
  yPosition -= 10;

  // Metadata
  yPosition = addText(`Date: ${new Date(transcription.createdAt).toLocaleDateString()}`, 12, font);
  yPosition = addText(`Duration: ${formatDuration(transcription.segments)}`, 12, font);
  yPosition -= 20;

  // Summary
  if (transcription.summary) {
    yPosition = addText('SUMMARY:', 14, boldFont);
    yPosition -= 5;
    yPosition = addText(transcription.summary, 12, font);
    yPosition -= 20;
  }

  // Transcript
  yPosition = addText('TRANSCRIPT:', 14, boldFont);
  yPosition -= 10;

  transcription.segments.forEach((segment: any) => {
    const timestamp = formatTime(segment.startTime);
    const speaker = segment.speaker ? `[${segment.speaker}] ` : '';
    const segmentText = `${timestamp} ${speaker}${segment.text}`;
    
    yPosition = addText(segmentText, 10, font);
    yPosition -= 10;
    
    // Check if we need a new page
    if (yPosition < margin) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${transcription.originalName}.pdf"`,
    },
  });
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

function formatDuration(segments: any[]) {
  if (segments.length === 0) return '0:00';
  const lastSegment = segments[segments.length - 1];
  return formatTime(lastSegment.endTime);
}
