import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  CheckCircle2,
  FileAudio,
  Headphones,
  Languages,
  Type,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Powerful Audio Transcription
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our advanced AI technology converts your audio files into accurate
              text with timestamps and speaker recognition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileAudio className="w-6 h-6" />,
                title: "Multiple Formats",
                description: "Support for MP3, WAV, M4A and more",
              },
              {
                icon: <Type className="w-6 h-6" />,
                title: "High Accuracy",
                description: "AI-powered transcription with 95%+ accuracy",
              },
              {
                icon: <Languages className="w-6 h-6" />,
                title: "Multiple Languages",
                description: "Support for 30+ languages worldwide",
              },
              {
                icon: <Headphones className="w-6 h-6" />,
                title: "Clear Timestamps",
                description: "Precise timing for every section",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Three simple steps to get your audio transcribed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Audio</h3>
              <p className="text-gray-600">
                Drag & drop or browse to upload your audio file in any common
                format
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Transcription</h3>
              <p className="text-gray-600">
                Our advanced AI processes your audio with high accuracy
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Your Text</h3>
              <p className="text-gray-600">
                Download or copy your transcription with timestamps
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transcribe Your Audio?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who save time with our audio transcription
            service.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Start Transcribing Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
