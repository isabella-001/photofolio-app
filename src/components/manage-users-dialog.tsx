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

  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    removeUser(userToDelete.name);
    toast({
      title: "User Removed",
      description: `User "${userToDelete.name}" has been removed.`,
    });

    if (userToDelete.name === currentUser) {
      handleLogout();
    } else {
      setUsers(getUsers()); // Refresh the list
    }

    setUserToDelete(null);
  };

  return (
    <>
      <DeleteConfirmationDialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description={`Are you sure you want to remove the user "${userToDelete?.name}"? This action cannot be undone.`}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Users</DialogTitle>
            <DialogDescription>
              Remove users from the application.
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
