/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/actions/create-workspace";
import { Workspace } from "@prisma/client";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  canCreate: boolean; 
  onWorkspaceCreated: (workspace: Workspace) => void;
}

export function AddWorkspaceDialog({ 
  open, 
  onOpenChange, 
  userId, 
  canCreate,
  onWorkspaceCreated 
}: AddWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open && canCreate && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open, canCreate]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) {
      toast("Invalid workspace name")
      return;
    }

    setLoading(true);
    try {
      const newWorkspace = await createWorkspace({ name, userId });
      
      // This is where the magic happens - we need to make sure this correctly updates the parent state
      if (newWorkspace) {
        onWorkspaceCreated(newWorkspace);
        
        toast(`Workspace "${name}" has been created`);
        
        onOpenChange(false);
        setName("");
      } else {
        throw new Error("Failed to create workspace");
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle keyboard actions
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim() && !loading) {
      e.preventDefault();
      handleCreate();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {canCreate ? "Create New Workspace" : "Workspace Limit Reached"}
          </DialogTitle>
          {!canCreate && (
            <DialogDescription>
              You've reached your current plan's workspace limit
            </DialogDescription>
          )}
        </DialogHeader>

        {canCreate ? (
          <>
            <div className="space-y-4 pt-2">
              <Input
                ref={inputRef}
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                onKeyDown={handleKeyDown}
                className="focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Enter a descriptive name for your new workspace
              </p>
            </div>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || name.trim().length === 0}
                className="focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 pt-2">
            <Alert variant="destructive">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Workspace limit reached</p>
                  <AlertDescription className="text-sm">
                    To create more workspaces, please upgrade your subscription plan
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                Cancel
              </Button>
              <Button 
                asChild
                className="focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <Link href="/settings/subscription" onClick={() => onOpenChange(false)}>
                  Upgrade Plan
                </Link>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}