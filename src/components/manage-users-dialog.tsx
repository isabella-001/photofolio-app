
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getUsers, removeUser, User } from "@/lib/user-store";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { Trash2, User as UserIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

type ManageUsersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  handleLogout: () => void;
};

export function ManageUsersDialog({
  open,
  onOpenChange,
  currentUser,
  handleLogout,
}: ManageUsersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setUsers(getUsers());
    }
  }, [open]);

  const handleConfirmDelete = async () => {
    if (!userToDelete || !db) return;

    toast({
      title: "Removing User...",
      description: `Please wait while we remove ${userToDelete.name} and all their data.`,
    });

    try {
      // 1. Find all collections for the user
      const collectionsQuery = query(
        collection(db, "collections"),
        where("userName", "==", userToDelete.name)
      );
      const collectionsSnapshot = await getDocs(collectionsQuery);
      const photoUrlsToDelete: string[] = [];

      // 2. Go through each collection to delete photos and subcollections
      for (const collectionDoc of collectionsSnapshot.docs) {
        const collectionId = collectionDoc.id;

        // 2a. Get all photos in the subcollection
        const photosQuery = query(
          collection(db, `collections/${collectionId}/photos`)
        );
        const photosSnapshot = await getDocs(photosQuery);

        const photoDocDeletions: Promise<void>[] = [];
        photosSnapshot.forEach((photoDoc) => {
          const photoData = photoDoc.data();
          if (photoData.src) {
            photoUrlsToDelete.push(photoData.src);
          }
          photoDocDeletions.push(
            deleteDoc(doc(db, `collections/${collectionId}/photos`, photoDoc.id))
          );
        });

        // 2b. Delete all photo documents in the subcollection
        await Promise.all(photoDocDeletions);

        // 2c. Delete the collection document itself
        await deleteDoc(doc(db, "collections", collectionId));
      }

      // 3. Delete all images from Vercel Blob storage
      if (photoUrlsToDelete.length > 0) {
        const response = await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: photoUrlsToDelete }),
        });
        if (!response.ok) {
          // Don't throw, just log it. The user/data is already gone from DB.
          console.error("Failed to delete some images from blob storage.");
          toast({
            title: "Partial Failure",
            description: "Could not delete all images from storage, but user data was removed.",
            variant: "destructive"
          });
        }
      }

      // 4. Remove the user from the local user store
      removeUser(userToDelete.name);

      toast({
        title: "User Removed",
        description: `User "${userToDelete.name}" and all their photos have been removed.`,
      });

      // 5. If deleting self, log out. Otherwise, refresh the list.
      if (userToDelete.name === currentUser) {
        handleLogout();
      } else {
        setUsers(getUsers());
      }
    } catch (error) {
      console.error("Error removing user and their data:", error);
      toast({
        title: "Error",
        description: "Could not remove the user and their data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <>
      <DeleteConfirmationDialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description={`Are you sure you want to remove the user "${userToDelete?.name}" and all of their photos? This action cannot be undone.`}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Users</DialogTitle>
            <DialogDescription>
              Remove users and all of their associated data from the
              application.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.name}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setUserToDelete(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
