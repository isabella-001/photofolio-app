"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";

type PhotoGridProps = {
  images: { id: string; src: string; hint?: string }[];
};

export function PhotoGrid({ images }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {images.map((image) => (
        <Card
          key={image.id}
          className="overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
        >
          <div className="aspect-square relative">
            <Image
              src={image.src}
              alt="User uploaded content"
              fill
              className="object-cover"
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16.6vw"
              data-ai-hint={image.hint || 'gallery photo'}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
