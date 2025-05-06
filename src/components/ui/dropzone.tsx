"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileAudio } from "lucide-react";

export interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  acceptedFileTypes?: string[];
  maxSize?: number;
  onFileSelect?: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  (
    {
      className,
      acceptedFileTypes = ["audio/mp3", "audio/wav", "audio/m4a", "audio/mpeg"],
      maxSize = 50 * 1024 * 1024, // 50MB default
      onFileSelect,
      isUploading = false,
      uploadProgress = 0,
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      [],
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      },
      [],
    );

    const validateFile = (file: File): boolean => {
      // Check file type
      if (!acceptedFileTypes.includes(file.type)) {
        setError(
          `File type not supported. Please upload ${acceptedFileTypes.join(", ")}`,
        );
        return false;
      }

      // Check file size
      if (file.size > maxSize) {
        setError(
          `File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`,
        );
        return false;
      }

      setError(null);
      return true;
    };

    const handleDrop = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;

        if (validateFile(droppedFile)) {
          setFile(droppedFile);
          if (onFileSelect) onFileSelect(droppedFile);
        }
      },
      [acceptedFileTypes, maxSize, onFileSelect],
    );

    const handleFileInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (validateFile(selectedFile)) {
          setFile(selectedFile);
          if (onFileSelect) onFileSelect(selectedFile);
        }
      },
      [acceptedFileTypes, maxSize, onFileSelect],
    );

    const handleBrowseClick = () => {
      fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50",
          file ? "border-green-500 bg-green-50" : "",
          isUploading ? "border-blue-500 bg-blue-50" : "",
          className,
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileInputChange}
        />

        {isUploading ? (
          <div className="w-full">
            <div className="flex items-center justify-center mb-4">
              <FileAudio className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-center text-gray-500">
              Transcribing... {uploadProgress}%
            </p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <FileAudio className="w-8 h-8 mr-2 text-green-500" />
                <div>
                  <p
                    className="text-sm font-medium text-gray-700 truncate"
                    style={{ maxWidth: "200px" }}
                  >
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mb-4 text-gray-400" />
            <p className="mb-2 text-lg font-semibold text-gray-700">
              Drag & drop your audio file here
            </p>
            <p className="mb-4 text-sm text-gray-500">or</p>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Browse Files
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Supports MP3, WAV, M4A (max {Math.round(maxSize / (1024 * 1024))}
              MB)
            </p>
          </>
        )}

        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
      </div>
    );
  },
);

Dropzone.displayName = "Dropzone";

export { Dropzone };
