"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Image as ImageIcon, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCollectionDialog } from "@/components/create-collection-dialog";
import { PhotoUploader } from "@/components/photo-uploader";
import { PhotoGrid } from "@/components/photo-grid";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Photo {
  id: string;
  src: string;
  hint?: string;
}

interface Collection {
  id: string;
  title: string;
  photos: Photo[];
}

export function PhotoFolioApp() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setCollections([
      {
        id: "landscapes-1",
        title: "Landscapes",
        photos: [
          {
            id: "p1",
            src: "https://placehold.co/600x600.png",
            hint: "mountain landscape",
          },
          {
            id: "p2",
            src: "https://placehold.co/600x600.png",
            hint: "ocean sunset",
          },
          {
            id: "p3",
            src: "https://placehold.co/600x600.png",
            hint: "forest path",
          },
        ],
      },
      {
        id: "portraits-1",
        title: "Portraits",
        photos: [
          {
            id: "p4",
            src: "https://placehold.co/600x600.png",
            hint: "woman smiling",
          },
        ],
      },
      { id: "urban-1", title: "Urban Exploration", photos: [] },
    ]);
    setIsMounted(true);
  }, []);

  const handleCreateCollection = (title: string) => {
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      title,
      photos: [],
    };
    setCollections((prev) => [newCollection, ...prev]);
  };

  const handleAddImagesToCollection = useCallback(
    (collectionId: string, imageUrls: string[]) => {
      const newPhotos: Photo[] = imageUrls.map((src) => ({
        id: crypto.randomUUID(),
        src,
      }));

      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, photos: [...c.photos, ...newPhotos] }
            : c
        )
      );
    },
    []
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (collections.length === 0) {
        toast({
            title: "No collection found",
            description: "Please create a collection first to paste images.",
            variant: "destructive"
        })
        return;
      }
      const files = event.clipboardData?.files;
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        event.preventDefault();
        const urls = imageFiles.map((file) => URL.createObjectURL(file));
        handleAddImagesToCollection(collections[0].id, urls);
        toast({
          title: "Paste successful!",
          description: `${imageFiles.length} image(s) have been added to "${collections[0].title}".`,
        });
      }
    },
    [collections, handleAddImagesToCollection, toast]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                PhotoFolio
              </h1>
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <CreateCollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={handleCreateCollection}
      />
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                PhotoFolio
              </h1>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-6 space-y-8">
          {collections.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <Wind className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold">Your Folio is Empty</h2>
              <p className="text-muted-foreground mt-2">
                Start by creating a new collection to organize your photos.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-6">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Collection
              </Button>
            </div>
          ) : (
            collections.map((collection) => (
              <Card
                key={collection.id}
                className="overflow-hidden shadow-lg transition-shadow hover:shadow-xl"
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{collection.title}</CardTitle>
                  {collection.photos.length > 0 && (
                    <CardDescription>
                      {collection.photos.length} photo(s)
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {collection.photos.length > 0 && (
                    <PhotoGrid images={collection.photos} />
                  )}
                  <PhotoUploader
                    onUpload={(urls) =>
                      handleAddImagesToCollection(collection.id, urls)
                    }
                  />
                </CardContent>
              </Card>
            ))
          )}
        </main>

        <footer className="container mx-auto py-6 px-4 md:px-6 text-center text-sm text-muted-foreground border-t">
          <p>Built for you, by PhotoFolio.</p>
        </footer>
      </div>
    </>
  );
}
