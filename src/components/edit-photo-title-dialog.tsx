"use client";

import { useState, useEffect } from "react";
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

type EditPhotoTitleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newTitle: string) => void;
  initialTitle: string;
};

export function EditPhotoTitleDialog({
  open,
  onOpenChange,
  onSave,
  initialTitle,
}: EditPhotoTitleDialogProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
    }
  }, [open, initialTitle]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Photo Title</DialogTitle>
          <DialogDescription>
            Update the title of your photo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={!title.trim() || title.trim() === initialTitle}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
