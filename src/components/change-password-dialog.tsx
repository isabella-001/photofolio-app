"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateUserPassword } from "@/lib/user-store";
import { Loader2 } from "lucide-react";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userName,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUserPassword(
        userName,
        currentPassword,
        newPassword
      );
      if (result.success) {
        toast({
          title: "Success!",
          description: "Your password has been changed successfully.",
        });
        onOpenChange(false);
        // Clear fields after successful change
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.message);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast({
        title: "Error",
        description: `Could not change password: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset state when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and a new password below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-password" className="text-right">
              Current
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              New
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-right">
              Confirm
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
           {error && <p className="col-span-4 text-sm text-center text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={!currentPassword || !newPassword || isSubmitting}
          >
             {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
