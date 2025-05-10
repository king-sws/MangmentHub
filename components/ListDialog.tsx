/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  isLoading: boolean;
  initialTitle?: string;
}

export function ListDialog({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialTitle = ""
}: ListDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setIsDirty(false);
    }
  }, [isOpen, initialTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    onSave(title);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Create New List
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">List Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Enter list title"
                disabled={isLoading}
                required
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create List"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}