import {
  Upload,
  FileAudio,
  Clock,
  Users,
  Download,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileAudio className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Transcriptron</h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/history"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                History
              </Link>
              <Link
                href="/transcribe"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start Transcribing
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            AI-Powered Audio Transcription
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your audio files into accurate, timestamped transcripts
            with speaker identification and AI-generated summaries.
          </p>
          <Link
            href="/transcribe"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            Upload Audio File
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground">
              Everything you need for professional audio transcription
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Formats</h3>
              <p className="text-sm text-muted-foreground">
                Support for MP3, WAV, M4A, and other popular audio formats
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Timestamp Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                Precise word and sentence-level timestamps for easy navigation
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Speaker Identification</h3>
              <p className="text-sm text-muted-foreground">
                Automatic speaker diarization to identify different voices
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI Summaries</h3>
              <p className="text-sm text-muted-foreground">
                Get intelligent summaries and key points from your transcripts
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Export Options</h3>
              <p className="text-sm text-muted-foreground">
                Download transcripts as TXT or PDF files
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fast Processing</h3>
              <p className="text-sm text-muted-foreground">
                Quick turnaround times powered by OpenAI Whisper
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">@Transcriptron</p>
        </div>
      </footer>
    </div>
  );
}
