"use client";

import { Workspace } from "@prisma/client";
import { MoreVertical, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { deleteWorkspace, renameWorkspace } from "@/actions/workspace-actions";

interface WorkspaceActionsProps {
  workspace: Workspace;
  onAction: () => void;
}

export function WorkspaceActions({ workspace, onAction }: WorkspaceActionsProps) {
  const [open, setOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [isLoading, setIsLoading] = useState(false);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset name when workspace changes
  useEffect(() => {
    setName(workspace.name);
  }, [workspace.name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        actionButtonRef.current &&
        dropdownRef.current &&
        !actionButtonRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function handleRename() {
    try {
      setIsLoading(true);
      await renameWorkspace({ id: workspace.id, name });
      setRenameDialog(false);
      onAction(); // Refresh workspace list
    } catch (error) {
      console.error("Error renaming workspace:", error);
      alert("Failed to rename workspace");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setIsLoading(true);
      await deleteWorkspace({ id: workspace.id });
      setDeleteDialog(false);
      onAction(); // Refresh workspace list
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Failed to delete workspace");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* 3 Dots Button */}
      <Button
        ref={actionButtonRef}
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Dropdown Actions */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-6 mt-1 z-50 bg-white border rounded-md shadow-md min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            className="w-full justify-start px-3 py-2 text-sm"
            onClick={() => {
              setRenameDialog(true);
              setOpen(false);
            }}
          >
            <Edit className="h-4 w-4 mr-2" /> Rename
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-3 py-2 text-sm text-red-600"
            onClick={() => {
              setDeleteDialog(true);
              setOpen(false);
            }}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-4"
            placeholder="Workspace name"
            disabled={isLoading}
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setRenameDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isLoading || name.length === 0}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            Are you sure you want to delete &quot;{workspace.name}&quot;? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}