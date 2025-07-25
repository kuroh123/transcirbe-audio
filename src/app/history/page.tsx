"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileAudio,
  Clock,
  Calendar,
  Eye,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TranscriptionPreview {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  text: string | null;
  summary: string | null;
  createdAt: string;
  segments: Array<{
    id: string;
    text: string;
    startTime: number;
  }>;
}

export default function HistoryPage() {
  const [transcriptions, setTranscriptions] = useState<TranscriptionPreview[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const fetchTranscriptions = async () => {
    try {
      const response = await fetch("/api/transcriptions");
      if (response.ok) {
        const data = await response.json();
        setTranscriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transcriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTranscriptions = transcriptions.filter(
    (t) =>
      t.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.text && t.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.summary && t.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const downloadTranscript = async (
    id: string,
    fileName: string,
    format: "txt" | "pdf"
  ) => {
    try {
      const response = await fetch(`/api/export?id=${id}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${format}`;
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
            <nav className="flex gap-4">
              <Link href="/transcribe">
                <Button variant="outline">New Transcription</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header and Search */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Transcription History</h2>
              <p className="text-gray-600 mt-1">
                {transcriptions.length} transcription
                {transcriptions.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transcriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transcriptions List */}
          {filteredTranscriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm
                    ? "No matching transcriptions"
                    : "No transcriptions yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Upload your first audio file to get started"}
                </p>
                {!searchTerm && (
                  <Link href="/transcribe">
                    <Button>Create Transcription</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTranscriptions.map((transcription) => (
                <Card
                  key={transcription.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <FileAudio className="h-5 w-5 text-primary flex-shrink-0" />
                          <h3 className="font-semibold text-lg truncate">
                            {transcription.originalName}
                          </h3>
                          <Badge
                            className={getStatusColor(transcription.status)}
                          >
                            {transcription.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatDate(transcription.createdAt)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {formatFileSize(transcription.fileSize)}
                          </div>
                          {transcription.segments.length > 0 && (
                            <div className="text-sm text-gray-600">
                              {transcription.segments.length} segments
                            </div>
                          )}
                        </div>

                        {/* Preview text */}
                        {transcription.segments.length > 0 && (
                          <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                            {transcription.segments[0].text}
                          </p>
                        )}

                        {/* Summary preview */}
                        {transcription.summary && (
                          <p className="text-gray-600 text-sm italic line-clamp-1 mb-4">
                            Summary: {transcription.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {transcription.status === "COMPLETED" && (
                          <>
                            <Button
                              onClick={() =>
                                downloadTranscript(
                                  transcription.id,
                                  transcription.originalName,
                                  "txt"
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              TXT
                            </Button>
                            <Button
                              onClick={() =>
                                downloadTranscript(
                                  transcription.id,
                                  transcription.originalName,
                                  "pdf"
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </Button>
                          </>
                        )}
                        <Link href={`/history/${transcription.id}`}>
                          <Button size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
