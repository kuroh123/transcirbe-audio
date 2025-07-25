"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { uploadFileToAssemblyAI } from "@/lib/upload";
import {
  Upload,
  FileAudio,
  Clock,
  Download,
  Sparkles,
  Play,
  Pause,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TranscriptionSegment {
  id: string;
  speaker: string | null;
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

interface Transcription {
  id: string;
  fileName: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  text: string | null;
  summary: string | null;
  segments: TranscriptionSegment[];
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up audio URL when file changes or component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    // Clean up previous URL when file changes
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Create new URL for the file
    if (file) {
      const newAudioUrl = URL.createObjectURL(file);
      setAudioUrl(newAudioUrl);
      setIsPlaying(false); // Reset playing state when new file is selected
    } else {
      setAudioUrl(null);
    }
  }, [file]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTranscription(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to AssemblyAI and get URL
      setUploadProgress(20);
      const audioUrl = await uploadFileToAssemblyAI(file);

      setUploadProgress(40);

      // Step 2: Send the URL to our backend for transcription
      const formData = new FormData();
      formData.append("audioUrl", audioUrl);
      formData.append("fileName", file.name);
      formData.append("fileSize", file.size.toString());
      formData.append("mimeType", file.type);
      if (userPrompt.trim()) {
        formData.append("userPrompt", userPrompt.trim());
      }

      console.log("Uploading transcription with data:", {
        audioUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userPrompt: userPrompt.trim(),
      });

      setUploadProgress(60);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setTranscription(result);
      } else {
        const error = await response.json();
        console.error("Transcription failed:", error.error);
        alert("Transcription failed: " + error.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        "Upload failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSegmentClick = (startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (audio.paused) {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadTranscript = async (format: "txt" | "pdf") => {
    if (!transcription) return;

    const response = await fetch(
      `/api/export?id=${transcription.id}&format=${format}`
    );
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${transcription.fileName}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileAudio className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Transcriptron</h1>
            </div>
            <nav className="flex gap-2">
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
              <Link href="/history">
                <Button variant="outline">History</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Audio File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">Choose an audio file</p>
                  <p className="text-sm text-gray-600">
                    MP3, WAV, M4A up to 25MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {file && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-600">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* User Prompt */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="userPrompt"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ask a question about the transcript (optional)
                      </Label>
                      <Textarea
                        id="userPrompt"
                        placeholder="e.g., What are the main action items discussed? Who are the key participants? Summarize the technical decisions made..."
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full min-h-[44px]"
                    >
                      {isUploading ? "Processing..." : "Transcribe & Analyze"}
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audio Player */}
          {file && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={togglePlayPause}
                    variant="outline"
                    size="sm"
                    className="min-w-[80px]"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <div className="flex-1">
                    <audio
                      key={file?.name || "no-file"}
                      ref={audioRef}
                      src={audioUrl || undefined}
                      onTimeUpdate={(e) =>
                        setCurrentTime(e.currentTarget.currentTime)
                      }
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      onLoadStart={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error("Audio error:", e);
                        setIsPlaying(false);
                      }}
                      className="w-full"
                      controls
                      preload="metadata"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Results */}
          {transcription && (
            <div className="space-y-6">
              {/* Summary */}
              {transcription.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {transcription.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Transcript */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileAudio className="h-5 w-5" />
                      Transcript
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadTranscript("txt")}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        TXT
                      </Button>
                      <Button
                        onClick={() => downloadTranscript("pdf")}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transcription.segments.map((segment) => (
                      <div
                        key={segment.id}
                        className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSegmentClick(segment.startTime)}
                      >
                        <div className="flex-shrink-0 w-20 text-sm text-gray-500">
                          {formatTime(segment.startTime)}
                        </div>
                        {segment.speaker && (
                          <div className="flex-shrink-0">
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <User className="h-3 w-3" />
                              {segment.speaker}
                            </Badge>
                          </div>
                        )}
                        <p className="flex-1 text-gray-900">{segment.text}</p>
                        {segment.confidence && (
                          <div className="flex-shrink-0 text-sm text-gray-400">
                            {Math.round(segment.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
