
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Image as ImageIcon, Wind, Trash2, AlertCircle, LogOut, Users, Pencil } from "lucide-react";
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
  where,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ThemeToggle } from "./theme-toggle";
import { ManageUsersDialog } from "./manage-users-dialog";
import { EditCollectionDialog } from "./edit-collection-dialog";
import { EditPhotoTitleDialog } from "./edit-photo-title-dialog";
import { LightboxDialog } from "./lightbox-dialog";

// Interfaces
interface Photo {
  id: string;
  src: string;
  title: string;
  hint?: string;
  createdAt: Timestamp;
}

interface Collection {
  id: string;
  title: string;
  userName: string;
  photos: Photo[];
  createdAt: Timestamp;
}

export function PhotoFolioApp({ userName }: { userName: string }) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
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
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<(Photo & { collectionId: string }) | null>(null);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      router.push('/login');
    } catch (e) {
      console.error("Couldn't use localStorage", e);
      toast({
        title: "Logout failed",
        description: "Could not clear authentication state.",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  if (!db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl p-4 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured or Invalid</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Your app is not connected to a Firebase backend, so data cannot
                be saved. This can happen if your Firebase configuration is
                missing or incorrect.
              </p>
              <p className="font-semibold mt-4">To fix this for deployment:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>
                  Go to your project settings on the Vercel dashboard.
                </li>
                <li>
                  Navigate to the &quot;Environment Variables&quot; section.
                </li>
                <li>
                  Ensure all the `NEXT_PUBLIC_FIREBASE_*` variables from your
                  local `.env` file are present and have the correct values.
                </li>
              </ol>
              <p className="mt-3">
                After adding or correcting the variables, you must
                re-deploy your project for the changes to take effect.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Fetch collections and their photos from Firestore
  useEffect(() => {
    if (!db || !userName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Query without orderBy to avoid needing a composite index
    const q = query(
      collection(db, "collections"),
      where("userName", "==", userName)
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const collectionsData: Collection[] = await Promise.all(
          querySnapshot.docs.map(async (collectionDoc) => {
            // Query photos without ordering to prevent index issues
            const photosQuery = query(
              collection(db, `collections/${collectionDoc.id}/photos`)
            );
            const photosSnapshot = await getDocs(photosQuery);
            const photos = photosSnapshot.docs.map((photoDoc) => ({
              id: photoDoc.id,
              ...(photoDoc.data() as Omit<Photo, "id">),
            }));

            // Sort photos on the client
            photos.sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
              }
              return 0;
            });

            return {
              id: collectionDoc.id,
              ...(collectionDoc.data() as Omit<
                Collection,
                "id" | "photos"
              >),
              photos,
            };
          })
        );
        
        // Sort collections by creation date on the client
        collectionsData.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
            return 0;
        });

        setCollections(collectionsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching collections:", error);
        toast({
          title: "Error Loading Data",
          description:
            "Could not load collections. This might be due to a missing database index or a network issue.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userName, toast]);

  const handleCreateCollection = async (title: string) => {
    try {
      await addDoc(collection(db, "collections"), {
        title,
        userName: userName,
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
            return addDoc(collection(db, `collections/${collectionId}/photos`), {
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
            deleteDoc(doc(db, `collections/${collectionId}/photos`, photo.id))
          )
        );

        // Delete collection document from Firestore
        await deleteDoc(doc(db, "collections", collectionId));

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
          doc(db, `collections/${collectionId}/photos`, dialogState.id!)
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

  const handleOpenEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
  };

  const handleUpdateCollectionTitle = async (newTitle: string) => {
      if (!editingCollection || !db) return;
      try {
          const collectionRef = doc(db, 'collections', editingCollection.id);
          await updateDoc(collectionRef, { title: newTitle });
          toast({ title: 'Success', description: 'Collection title updated.' });
          setEditingCollection(null);
      } catch (error) {
          console.error('Error updating collection title:', error);
          toast({ title: 'Error', description: 'Failed to update collection title.', variant: 'destructive' });
      }
  };

  const handleOpenEditPhoto = (photo: Photo, collectionId: string) => {
      setEditingPhoto({ ...photo, collectionId });
  };

  const handleUpdatePhotoTitle = async (newTitle: string) => {
      if (!editingPhoto || !db) return;
      try {
          const photoRef = doc(db, `collections/${editingPhoto.collectionId}/photos`, editingPhoto.id);
          await updateDoc(photoRef, { title: newTitle });
          toast({ title: 'Success', description: 'Photo title updated.' });
          setEditingPhoto(null);
      } catch (error) {
          console.error('Error updating photo title:', error);
          toast({ title: 'Error', description: 'Failed to update photo title.', variant: 'destructive' });
      }
  };

  const handlePhotoClick = (photo: Photo) => {
    setLightboxPhoto(photo);
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
        open={isCreateCollectionOpen}
        onOpenChange={setIsCreateCollectionOpen}
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
      <ManageUsersDialog
        open={isManageUsersOpen}
        onOpenChange={setIsManageUsersOpen}
        currentUser={userName}
        handleLogout={handleLogout}
      />
      <EditCollectionDialog
        open={!!editingCollection}
        onOpenChange={(isOpen) => !isOpen && setEditingCollection(null)}
        initialTitle={editingCollection?.title || ""}
        onSave={handleUpdateCollectionTitle}
      />
      <EditPhotoTitleDialog
        open={!!editingPhoto}
        onOpenChange={(isOpen) => !isOpen && setEditingPhoto(null)}
        initialTitle={editingPhoto?.title || ""}
        onSave={handleUpdatePhotoTitle}
      />
      <LightboxDialog
        open={!!lightboxPhoto}
        onOpenChange={(isOpen) => !isOpen && setLightboxPhoto(null)}
        src={lightboxPhoto?.src}
        alt={lightboxPhoto?.title}
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
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateCollectionOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Collection
              </Button>
              <ThemeToggle />
              <Button variant="outline" size="icon" onClick={() => setIsManageUsersOpen(true)} title="Manage Users">
                <Users className="h-4 w-4" />
                <span className="sr-only">Manage Users</span>
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
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
              <Button onClick={() => setIsCreateCollectionOpen(true)} className="mt-6">
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
                     <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEditCollection(collection)}
                        >
                            <Pencil className="h-5 w-5" />
                            <span className="sr-only">Edit collection title</span>
                        </Button>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <PhotoGrid
                    images={collection.photos}
                    onDelete={handleDeletePhoto}
                    onEditPhoto={(photo) => handleOpenEditPhoto(photo, collection.id)}
                    onPhotoClick={handlePhotoClick}
                  />
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
