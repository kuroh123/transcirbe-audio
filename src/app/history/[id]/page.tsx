"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileAudio,
  Clock,
  Download,
  Sparkles,
  User,
  MessageSquare,
  Send,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  originalName: string;
  fileSize: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  text: string | null;
  summary: string | null;
  createdAt: string;
  segments: TranscriptionSegment[];
}

interface QAItem {
  question: string;
  answer: string;
  timestamp: Date;
}

export default function TranscriptionDetailPage() {
  const params = useParams();
  const transcriptionId = params.id as string;

  const [transcription, setTranscription] = useState<Transcription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);

  useEffect(() => {
    if (transcriptionId) {
      fetchTranscription();
    }
  }, [transcriptionId]);

  const fetchTranscription = async () => {
    try {
      const response = await fetch(`/api/transcriptions/${transcriptionId}`);
      if (response.ok) {
        const data = await response.json();
        setTranscription(data);
      } else {
        console.error("Failed to fetch transcription");
      }
    } catch (error) {
      console.error("Failed to fetch transcription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !transcription || isAsking) return;

    setIsAsking(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptionId: transcription.id,
          question: question.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQaHistory([
          {
            question: question.trim(),
            answer: data.answer,
            timestamp: new Date(),
          },
          ...qaHistory,
        ]);
        setQuestion("");
      } else {
        console.error("Failed to get answer");
      }
    } catch (error) {
      console.error("Failed to ask question:", error);
    } finally {
      setIsAsking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const downloadTranscript = async (format: "txt" | "pdf") => {
    if (!transcription) return;

    try {
      const response = await fetch(
        `/api/export?id=${transcription.id}&format=${format}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${transcription.originalName}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <FileAudio className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Transcriptron</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <FileAudio className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Transcriptron</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Transcription not found</h2>
            <Link href="/history">
              <Button variant="outline">Back to History</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex gap-2">
              <Link href="/history">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to History
                </Button>
              </Link>
              <Link href="/transcribe">
                <Button variant="outline">New Transcription</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                {transcription.originalName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatDate(transcription.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {formatFileSize(transcription.fileSize)}
                </div>
                <div className="text-sm text-gray-600">
                  {transcription.segments.length} segments
                </div>
              </div>
              {transcription.status === "COMPLETED" && (
                <div className="flex gap-2 mt-4">
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
              )}
            </CardContent>
          </Card>

          {/* Ask Question */}
          {transcription.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ask a Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="question">
                      What would you like to know about this transcript?
                    </Label>
                    <Textarea
                      id="question"
                      placeholder="e.g., What are the main action items? Who made the key decisions? What technical issues were discussed?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="min-h-[80px] mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleAskQuestion}
                    disabled={!question.trim() || isAsking}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isAsking ? "Getting Answer..." : "Ask Question"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Q&A History */}
          {qaHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Questions & Answers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {qaHistory.map((qa, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <div className="mb-2">
                        <p className="font-medium text-gray-900">
                          Q: {qa.question}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {qa.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">{qa.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {transcription.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {transcription.status === "COMPLETED" &&
            transcription.segments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileAudio className="h-5 w-5" />
                    Full Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transcription.segments.map((segment) => (
                      <div
                        key={segment.id}
                        className="flex gap-4 p-3 rounded-lg hover:bg-gray-50"
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
            )}
        </div>
      </div>
    </div>
  );
}
