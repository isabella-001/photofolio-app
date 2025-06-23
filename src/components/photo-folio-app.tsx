"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Image as ImageIcon, Wind, Trash2, AlertCircle } from "lucide-react";
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
import { PhotoUploadPreviewDialog } from "./photo-upload-preview-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

// Interfaces
interface Photo {
  id: string;
  src: string;
  title: string;
  hint?: string;
}

interface Collection {
  id: string;
  title: string;
  photos: Photo[];
}

export function PhotoFolioApp() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [filesToPreview, setFilesToPreview] = useState<File[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null
  );
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: "photo" | "collection" | null;
    id: string | null;
    title: string;
    meta?: any;
  }>({
    open: false,
    type: null,
    id: null,
    title: "",
  });

  if (!isFirebaseConfigured) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <div className="container mx-auto max-w-2xl p-4 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Your app is not connected to a backend, so data cannot be saved.</p>
              <p>Please create a Firebase project and add your configuration keys to a <strong>.env</strong> file in the root of this project to get started.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Fetch collections and their photos from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db!, "collections"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const collectionsData: Collection[] = await Promise.all(
        querySnapshot.docs.map(async (collectionDoc) => {
          const photosQuery = query(
            collection(db!, `collections/${collectionDoc.id}/photos`),
            orderBy("createdAt", "desc")
          );
          const photosSnapshot = await getDocs(photosQuery);
          const photos = photosSnapshot.docs.map((photoDoc) => ({
            id: photoDoc.id,
            ...(photoDoc.data() as Omit<Photo, 'id'>),
          }));

          return {
            id: collectionDoc.id,
            title: collectionDoc.data().title,
            photos,
          };
        })
      );
      setCollections(collectionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateCollection = async (title: string) => {
    try {
      await addDoc(collection(db!, "collections"), {
        title,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Collection created!",
        description: `Successfully created the "${title}" collection.`,
      });
    } catch (error) {
      console.error("Error creating collection: ", error);
      toast({
        title: "Error",
        description: "Could not create the collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInitiateUpload = (collectionId: string, files: File[]) => {
    setActiveCollectionId(collectionId);
    setFilesToPreview(files);
  };

  const handleAddImagesToCollection = useCallback(
    async (
      collectionId: string,
      newPhotos: { src: string; title: string }[]
    ) => {
      if (!collectionId) return;

      toast({
        title: "Saving to collection...",
        description: `Adding ${newPhotos.length} photo(s).`,
      });

      try {
        await Promise.all(
          newPhotos.map((photo) => {
            return addDoc(collection(db!, `collections/${collectionId}/photos`), {
              src: photo.src, // This is now the Vercel Blob URL
              title: photo.title,
              createdAt: serverTimestamp(),
            });
          })
        );
        toast({
          title: "Upload complete!",
          description: `${newPhotos.length} photo(s) added successfully.`,
        });
      } catch (error) {
        console.error("Error adding images: ", error);
        toast({
          title: "Upload failed",
          description: "Could not save the images to the collection. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (collections.length === 0) {
        toast({
          title: "No collection found",
          description: "Please create a collection first to paste images.",
          variant: "destructive",
        });
        return;
      }
      const files = event.clipboardData?.files;
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        event.preventDefault();
        // Default to the first (most recent) collection
        setActiveCollectionId(collections[0].id);
        setFilesToPreview(imageFiles);
      }
    },
    [collections, toast]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleDeleteCollection = (
    collectionId: string,
    collectionTitle: string
  ) => {
    const collectionToDelete = collections.find(c => c.id === collectionId);
    setDialogState({
      open: true,
      type: "collection",
      id: collectionId,
      title: collectionTitle,
      meta: { photos: collectionToDelete?.photos || [] }
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    let photoToDelete: Photo | undefined;
    let collectionIdOfPhoto: string | undefined;

    for (const collection of collections) {
      const photo = collection.photos.find((p) => p.id === photoId);
      if (photo) {
        photoToDelete = photo;
        collectionIdOfPhoto = collection.id;
        break;
      }
    }

    if (photoToDelete && collectionIdOfPhoto) {
      setDialogState({
        open: true,
        type: "photo",
        id: photoId,
        title: photoToDelete.title,
        meta: {
          collectionId: collectionIdOfPhoto,
          photoUrl: photoToDelete.src,
        },
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!dialogState.id || !dialogState.type) return;

    if (dialogState.type === "collection") {
      const { id: collectionId, title, meta } = dialogState;
      const photosToDelete: Photo[] = meta.photos || [];

      try {
        // Delete files from Vercel Blob
        if (photosToDelete.length > 0) {
          const photoUrls = photosToDelete.map(p => p.src);
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: photoUrls }),
          });
        }
        
        // Delete photo documents from Firestore
        await Promise.all(
          photosToDelete.map(photo => 
            deleteDoc(doc(db!, `collections/${collectionId}/photos`, photo.id))
          )
        );

        // Delete collection document from Firestore
        await deleteDoc(doc(db!, "collections", collectionId));

        toast({
          title: "Collection deleted",
          description: `The collection "${title}" has been removed.`,
        });
      } catch (error) {
        console.error("Error deleting collection: ", error);
        toast({
          title: "Error",
          description: "Failed to delete collection.",
          variant: "destructive",
        });
      }
    }

    if (dialogState.type === "photo") {
      const { collectionId, photoUrl } = dialogState.meta;
      try {
        // Delete from Vercel Blob
        await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [photoUrl] }),
        });
        
        // Delete from Firestore
        await deleteDoc(
          doc(db!, `collections/${collectionId}/photos`, dialogState.id!)
        );

        toast({
          title: "Photo deleted",
          description: `The photo "${dialogState.title}" has been removed.`,
        });
      } catch (error) {
        console.error("Error deleting photo: ", error);
        toast({
          title: "Error",
          description: "Failed to delete photo.",
          variant: "destructive",
        });
      }
    }

    setDialogState({ open: false, type: null, id: null, title: "" });
  };

  if (loading) {
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
      <PhotoUploadPreviewDialog
        open={filesToPreview.length > 0}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setFilesToPreview([]);
            setActiveCollectionId(null);
          }
        }}
        files={filesToPreview}
        onConfirm={(newPhotos) => {
          if (activeCollectionId) {
            handleAddImagesToCollection(activeCollectionId, newPhotos);
          }
        }}
      />
      <DeleteConfirmationDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState({ open: false, type: null, id: null, title: "" });
          }
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${
          dialogState.type === "collection" ? "Collection" : "Photo"
        }`}
        description={`Are you sure you want to delete "${dialogState.title}"? This action cannot be undone.`}
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        {collection.title}
                      </CardTitle>
                      {collection.photos.length > 0 && (
                        <CardDescription>
                          {collection.photos.length} photo(s)
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        handleDeleteCollection(collection.id, collection.title)
                      }
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Delete collection</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {collection.photos.length > 0 && (
                    <PhotoGrid
                      images={collection.photos}
                      onDelete={handleDeletePhoto}
                    />
                  )}
                  <PhotoUploader
                    onUpload={(files) =>
                      handleInitiateUpload(collection.id, files)
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
