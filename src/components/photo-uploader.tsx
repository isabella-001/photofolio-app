
"use client";

import { useState, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PhotoUploaderProps = {
  onUpload: (files: File[]) => void;
};

export function PhotoUploader({ onUpload }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) {
        toast({
          title: "No images found",
          description: "Please upload valid image files (PNG, JPG, etc.).",
          variant: "destructive",
        });
        return;
      }

      onUpload(imageFiles);
    },
    [onUpload, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      handleFiles(e.clipboardData.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-8 my-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/50 hover:border-primary hover:bg-background/80"
      )}
    >
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 z-10 w-full h-full p-8 bg-transparent border-none outline-none resize-none opacity-0 cursor-pointer"
        aria-label="Paste image from clipboard"
        readOnly
      />
      <div className="flex flex-col items-center justify-center text-center pointer-events-none">
        <UploadCloud
          className={cn(
            "w-12 h-12 mb-4 text-muted-foreground transition-colors duration-300",
            isDragging && "text-primary"
          )}
        />
        <p className="text-center text-muted-foreground">
          <span className="font-semibold text-accent">Drag & Drop</span> your
          images here
        </p>
        <p className="text-xs text-center text-muted-foreground">
          Or paste from clipboard. On mobile, tap here then hold to paste.
        </p>
      </div>
    </div>
  );
}
