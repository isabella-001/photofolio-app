"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

type PhotoGridProps = {
  images: { id: string; src: string; title: string; hint?: string }[];
  onDelete: (id: string) => void;
};

export function PhotoGrid({ images, onDelete }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <Card
          key={image.id}
          className="overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col group relative"
        >
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => onDelete(image.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete photo</span>
          </Button>

          <div className="aspect-square w-full relative">
            <Image
              src={image.src}
              alt={image.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              data-ai-hint={image.hint || "gallery photo"}
            />
          </div>

          <CardContent className="p-3 mt-auto">
            <div className="flex justify-between items-center gap-2">
              <p
                className="font-semibold text-sm truncate"
                title={image.title}
              >
                {image.title}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3 w-3" />
                <span className="sr-only">Edit title</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
