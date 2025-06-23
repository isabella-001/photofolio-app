
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
import { Trash2, User as UserIcon, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        setIsLoading(true);
        try {
          const userList = await getUsers();
          setUsers(userList);
        } catch (error) {
          console.error("Failed to fetch users:", error);
          toast({
            title: "Error",
            description: "Could not fetch the list of users.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchUsers();
    }
  }, [open, toast]);

  const handleConfirmDelete = async () => {
    if (!userToDelete || !db) return;

    if (userToDelete.name.toLowerCase() === 'star') {
      toast({
        title: "Action Prohibited",
        description: "The 'star' user cannot be removed.",
        variant: "destructive",
      });
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
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

        const photosQuery = query(
          collection(db, `collections/${collectionId}/photos`)
        );
        const photosSnapshot = await getDocs(photosQuery);
        
        for (const photoDoc of photosSnapshot.docs) {
           const photoData = photoDoc.data();
           if (photoData.src) {
             photoUrlsToDelete.push(photoData.src);
           }
           await deleteDoc(doc(db, `collections/${collectionId}/photos`, photoDoc.id));
        }

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
          console.error("Failed to delete some images from blob storage.");
        }
      }

      // 4. Remove the user from the users collection in Firestore
      await removeUser(userToDelete.name);

      toast({
        title: "User Removed",
        description: `User "${userToDelete.name}" and all their photos have been removed.`,
      });

      // 5. If deleting self, log out. Otherwise, refresh the list.
      if (userToDelete.name === currentUser) {
        handleLogout();
      } else {
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
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
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DeleteConfirmationDialog
        open={!!userToDelete && !isDeleting}
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
              application. This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
                users.map((user) => (
                <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-md border"
                >
                    <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{user.name}</span>
                    </div>
                    {user.name.toLowerCase() !== 'star' && (
                        <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setUserToDelete(user)}
                        disabled={isDeleting}
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
