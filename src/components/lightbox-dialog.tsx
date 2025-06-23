"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type LightboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string;
  alt?: string;
};

export function LightboxDialog({
  open,
  onOpenChange,
  src,
  alt,
}: LightboxDialogProps) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
        <Image
          src={src}
          alt={alt || "Full resolution view"}
          width={1920}
          height={1080}
          className="w-full h-auto object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
