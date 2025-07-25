"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileAudio,
  Clock,
  Download,
  Sparkles,
  Play,
  Pause,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const formData = new FormData();
    formData.append("audio", file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setTranscription(result);
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
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
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
          <div className="flex items-center gap-2">
            <FileAudio className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">TranscribeAI</h1>
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
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="min-w-[120px]"
                    >
                      {isUploading ? "Processing..." : "Transcribe"}
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
                      ref={audioRef}
                      src={file ? URL.createObjectURL(file) : undefined}
                      onTimeUpdate={(e) =>
                        setCurrentTime(e.currentTarget.currentTime)
                      }
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      className="w-full"
                      controls
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
