"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Photo = { id: string; src: string; title: string; hint?: string, order?: number };

type PhotoGridProps = {
  images: Photo[];
  onDelete: (id: string) => void;
  onEditPhoto: (photo: Photo) => void;
  onPhotoClick: (photo: Photo) => void;
  onReorder: (reorderedImages: Photo[]) => void;
};

function SortablePhotoItem({ 
  photo, 
  onDelete, 
  onEditPhoto, 
  onPhotoClick 
}: { 
  photo: Photo, 
  onDelete: (id: string) => void; 
  onEditPhoto: (photo: Photo) => void; 
  onPhotoClick: (photo: Photo) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="break-inside-avoid relative">
        <Card className="overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl flex flex-col group relative">
            <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete photo</span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onEditPhoto(photo); }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit title</span>
              </Button>
            </div>
            
            <div 
              {...attributes} 
              {...listeners} 
              className="absolute top-2 left-2 z-20 p-1 rounded-full bg-black/30 text-white cursor-grab touch-none opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()} // Prevent photo click when grabbing
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <button
              onClick={() => onPhotoClick(photo)}
              className="w-full block relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-t-lg"
            >
              <Image
                src={photo.src}
                alt={photo.title}
                width={500}
                height={500}
                className="w-full h-auto"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                data-ai-hint={photo.hint || "gallery photo"}
              />
            </button>

            <CardContent className="p-3 mt-auto">
              <p className="font-semibold text-sm truncate" title={photo.title}>
                {photo.title}
              </p>
            </CardContent>
        </Card>
    </div>
  );
}


export function PhotoGrid({
  images,
  onDelete,
  onEditPhoto,
  onPhotoClick,
  onReorder,
}: PhotoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((image) => image.id === active.id);
      const newIndex = images.findIndex((image) => image.id === over.id);
      
      const reorderedImages = arrayMove(images, oldIndex, newIndex);
      onReorder(reorderedImages);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {images.map((image) => (
                <SortablePhotoItem
                    key={image.id}
                    photo={image}
                    onDelete={onDelete}
                    onEditPhoto={onEditPhoto}
                    onPhotoClick={onPhotoClick}
                />
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
