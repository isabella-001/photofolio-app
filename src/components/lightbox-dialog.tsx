
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoUploader } from "./photo-uploader";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { upload } from "@vercel/blob/client";
import { Button } from "./ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

// Interfaces
interface Photo {
  id: string;
  src: string;
  title: string;
  hint?: string;
  createdAt: Timestamp;
}

interface PhotoVariant {
  id: string;
  src: string;
  createdAt: Timestamp;
}

type LightboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: Photo | null;
  collectionId: string | null;
};

export function LightboxDialog({
  open,
  onOpenChange,
  photo,
  collectionId,
}: LightboxDialogProps) {
  const [variants, setVariants] = useState<PhotoVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<PhotoVariant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && photo && collectionId && db) {
      setIsLoadingVariants(true);
      const variantsQuery = query(
        collection(db, `collections/${collectionId}/photos/${photo.id}/variants`),
        orderBy("createdAt", "asc")
      );

      const unsubscribe = onSnapshot(
        variantsQuery,
        (snapshot) => {
          const variantsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<PhotoVariant, "id">),
          }));
          setVariants(variantsData);
          setIsLoadingVariants(false);
        },
        (error) => {
          console.error("Error fetching photo variants:", error);
          toast({
            title: "Error",
            description: "Could not load photo variants.",
            variant: "destructive",
          });
          setIsLoadingVariants(false);
        }
      );

      return () => unsubscribe();
    } else {
      setVariants([]);
    }
  }, [open, photo, collectionId, toast]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!photo || !collectionId || !db) return;

      setIsUploading(true);
      toast({
        title: "Uploading variants...",
        description: `Adding ${files.length} new photo(s).`,
      });

      try {
        const uploadPromises = files.map(async (file) => {
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          
          await addDoc(
            collection(db, `collections/${collectionId}/photos/${photo.id}/variants`), {
            src: blob.url,
            createdAt: serverTimestamp(),
          });
        });

        await Promise.all(uploadPromises);

        toast({
          title: "Upload complete!",
          description: "All variants have been added successfully.",
        });
      } catch (error) {
        console.error("Error uploading variants:", error);
        toast({
          title: "Upload Failed",
          description: "Could not save one or more variants.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [photo, collectionId, toast]
  );
  
  const handleDeleteVariant = async () => {
    if (!variantToDelete || !photo || !collectionId || !db) return;

    try {
        // Delete from Vercel Blob
        const response = await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [variantToDelete.src] }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete image from storage.');
        }
        
        // Delete from Firestore
        await deleteDoc(
          doc(db, `collections/${collectionId}/photos/${photo.id}/variants`, variantToDelete.id)
        );

        toast({
          title: "Variant deleted",
          description: `The photo variant has been removed.`,
        });
    } catch (error) {
        console.error("Error deleting variant: ", error);
        toast({
          title: "Error",
          description: "Failed to delete photo variant.",
          variant: "destructive",
        });
    } finally {
        setVariantToDelete(null);
    }
  };


  if (!photo) return null;

  return (
    <>
      <DeleteConfirmationDialog
        open={!!variantToDelete}
        onOpenChange={(isOpen) => !isOpen && setVariantToDelete(null)}
        onConfirm={handleDeleteVariant}
        title="Delete Photo Variant"
        description="Are you sure you want to delete this photo variant? This action cannot be undone."
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="w-full aspect-video relative mb-4 bg-muted/20 rounded-lg">
              <Image
                src={photo.src}
                alt={photo.title || "Full resolution view"}
                fill
                className="w-full h-full object-contain"
              />
            </div>
            <DialogHeader className="text-left mb-6">
              <DialogTitle className="text-2xl">{photo.title}</DialogTitle>
            </DialogHeader>

            <div>
              <h3 className="text-lg font-semibold mb-3">Related Photos</h3>
              {isLoadingVariants ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {variants.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {variants.map((variant) => (
                        <div key={variant.id} className="relative group aspect-square">
                          <Image
                            src={variant.src}
                            alt="Photo variant"
                            fill
                            className="object-cover rounded-md"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setVariantToDelete(variant)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete variant</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No related photos have been added yet.
                    </p>
                  )}
                </>
              )}

              <div className="mt-6">
                {isUploading ? (
                    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                      <p>Uploading...</p>
                  </div>
                ) : (
                    <PhotoUploader onUpload={handleUpload} />
                )}
              </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
