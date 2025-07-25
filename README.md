# TranscribeAI - AI-Powered Audio Transcription MVP

A modern web application for transcribing audio files using OpenAI's Whisper API with features like speaker diarization, timestamped transcripts, AI summaries, and export capabilities.

## Features

- **Audio Upload**: Support for multiple audio formats (MP3, WAV, M4A, etc.)
- **AI Transcription**: Powered by OpenAI Whisper for accurate speech-to-text
- **Speaker Diarization**: Basic speaker identification and labeling
- **Timestamped Transcripts**: Click-to-seek functionality with precise timestamps
- **AI Summaries**: Automatic summarization using OpenAI GPT
- **Export Options**: Download transcripts as TXT or PDF files
- **Real-time Progress**: Visual upload and processing progress indicators

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenAI Whisper & GPT
- **UI Components**: Radix UI primitives
- **PDF Generation**: pdf-lib

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd transcribe_audio
   npm install
   ```

2. **Set up environment variables**:
   Copy the `.env` file and update the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/transcribe_audio?schema=public"
   
   # OpenAI API Key
   OPENAI_API_KEY="your_openai_api_key_here"
   
   # Next.js (optional)
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database**:
   ```bash
   # Push the schema to your database
   npm run db:push
   
   # Or use migrations (recommended for production)
   npm run db:migrate
   ```

4. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:3000`

### Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database management

## Usage

1. **Upload Audio**: Click "Start Transcribing" and select an audio file
2. **Wait for Processing**: The app will upload and transcribe your audio
3. **Review Results**: View the timestamped transcript with speaker labels
4. **Navigate Audio**: Click on any transcript segment to jump to that time
5. **Read Summary**: Check the AI-generated summary of key points
6. **Export**: Download the transcript as TXT or PDF

## API Endpoints

- `POST /api/transcribe` - Upload and transcribe audio files
- `GET /api/export?id={id}&format={txt|pdf}` - Export transcripts

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── transcribe/route.ts    # Transcription API
│   │   └── export/route.ts        # Export API
│   ├── transcribe/page.tsx        # Main transcription interface
│   ├── dashboard/page.tsx         # Alternative transcription interface
│   ├── page.tsx                   # Landing page
│   └── layout.tsx                 # Root layout
├── components/
│   └── ui/                        # Reusable UI components
├── lib/
│   └── prisma.ts                  # Prisma client setup
└── types/
    └── supabase.ts                # Type definitions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for Whisper/GPT | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth (optional) | No |
| `NEXTAUTH_URL` | Base URL for NextAuth (optional) | No |

## Limitations & Future Improvements

### Current Limitations
- Basic speaker diarization (alternating speakers)
- 25MB file size limit
- Simplified confidence scoring

### Potential Improvements
- Advanced speaker diarization with voice recognition
- Support for larger files with chunking
- Real-time transcription for live audio
- Multiple language support
- User authentication and history
- Collaborative transcript editing
- Integration with cloud storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support, please open an issue on GitHub or contact the development team.
