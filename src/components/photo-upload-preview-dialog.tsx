"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateTitle } from "@/ai/flows/generate-title-flow";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface PhotoPreview {
  file: File;
  previewUrl: string;
  title: string;
}

type PhotoUploadPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onConfirm: (photos: { src: string; title: string }[]) => void;
};

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function PhotoUploadPreviewDialog({
  open,
  onOpenChange,
  files,
  onConfirm,
}: PhotoUploadPreviewDialogProps) {
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (files.length > 0) {
      const newPreviews = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        title: "",
      }));
      setPreviews(newPreviews);
    } else {
      setPreviews([]);
    }

    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleTitleChange = (index: number, newTitle: string) => {
    setPreviews((current) =>
      current.map((p, i) => (i === index ? { ...p, title: newTitle } : p))
    );
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const photosWithTitles = await Promise.all(
        previews.map(async (p) => {
          let finalTitle = p.title.trim();
          if (!finalTitle) {
            try {
              const dataUri = await fileToDataUri(p.file);
              const result = await generateTitle({ photoDataUri: dataUri });
              finalTitle = result.title;
            } catch (error) {
              console.error("Failed to generate title:", error);
              finalTitle = `Untitled Photo ${Date.now()}`;
              toast({
                title: "Couldn't generate title for an image",
                description: "Using a fallback title.",
                variant: "destructive",
              });
            }
          }
          return { ...p, title: finalTitle };
        })
      );

      const dataUriPhotos = await Promise.all(
        photosWithTitles.map(async (p) => ({
          src: await fileToDataUri(p.file),
          title: p.title,
        }))
      );

      onConfirm(dataUriPhotos);
      onOpenChange(false);
      toast({
        title: "Upload successful!",
        description: `${files.length} image(s) have been added.`,
      });
    } catch (error) {
      console.error("Error during confirmation:", error);
      toast({
        title: "An error occurred",
        description: "Could not add photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Photos</DialogTitle>
          <DialogDescription>
            Add a title for each photo below. If you leave a title blank, one
            will be generated for you.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow -mx-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6">
            {previews.map((p, index) => (
              <div key={p.previewUrl} className="space-y-2">
                <div className="rounded-md overflow-hidden aspect-square">
                  <Image
                    src={p.previewUrl}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Enter title..."
                  value={p.title}
                  onChange={(e) => handleTitleChange(index, e.target.value)}
                  disabled={isProcessing}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="animate-spin mr-2" />
            ) : null}
            {isProcessing
              ? "Processing..."
              : `Add ${previews.length} Photo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
