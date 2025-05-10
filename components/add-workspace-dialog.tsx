/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/actions/create-workspace";
import { Workspace } from "@prisma/client";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface AddWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  canCreate: boolean; // 🆕 New prop for subscription check
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

  async function handleCreate() {
    setLoading(true);
    try {
      const newWorkspace = await createWorkspace({ name, userId });
      onWorkspaceCreated(newWorkspace);
      onOpenChange(false);
      setName("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
            <div className="space-y-4">
              <Input
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                onClick={handleCreate}
                disabled={loading || name.length === 0}
              >
                {loading ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Upgrade required</p>
                  <p className="text-sm">To create more workspaces, please upgrade your plan</p>
                </div>
              </div>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button asChild>
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