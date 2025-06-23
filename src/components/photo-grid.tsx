"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

type Photo = { id: string; src: string; title: string; hint?: string };

type PhotoGridProps = {
  images: Photo[];
  onDelete: (id: string) => void;
  onEditPhoto: (photo: Photo) => void;
  onPhotoClick: (photo: Photo) => void;
};

export function PhotoGrid({
  images,
  onDelete,
  onEditPhoto,
  onPhotoClick,
}: PhotoGridProps) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
      {images.map((image) => (
        <div key={image.id} className="break-inside-avoid">
          <Card className="overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col group relative">
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDelete(image.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete photo</span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEditPhoto(image)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit title</span>
              </Button>
            </div>

            <button
              onClick={() => onPhotoClick(image)}
              className="w-full block relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-t-lg"
            >
              <Image
                src={image.src}
                alt={image.title}
                width={500}
                height={500}
                className="w-full h-auto"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                data-ai-hint={image.hint || "gallery photo"}
              />
            </button>

            <CardContent className="p-3 mt-auto">
              <p className="font-semibold text-sm truncate" title={image.title}>
                {image.title}
              </p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
