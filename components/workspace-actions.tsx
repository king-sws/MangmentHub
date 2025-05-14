/* eslint-disable react/no-unescaped-entities */
"use client";

import { Workspace } from "@prisma/client";
import { MoreVertical, Edit, Trash, Archive, Share, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, useCallback } from "react";
import { deleteWorkspace, renameWorkspace } from "@/actions/workspace-actions";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface WorkspaceActionsProps {
  workspace: Workspace;
  onAction: () => void;
}

export function WorkspaceActions({ workspace, onAction }: WorkspaceActionsProps) {
  const [renameDialog, setRenameDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset name when workspace changes
  useEffect(() => {
    setName(workspace.name);
  }, [workspace.name]);

  // Focus the input when the rename dialog opens
  useEffect(() => {
    if (renameDialog && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [renameDialog]);

  const handleRename = useCallback(async () => {
    if (!name.trim()) {
      toast("Validation Error");
      return;
    }

    try {
      setIsLoading(true);
      await renameWorkspace({ id: workspace.id, name });
      setRenameDialog(false);
      onAction(); // Refresh workspace list
      toast("Workspace renamed")
    } catch (error) {
      console.error("Error renaming workspace:", error);
      toast("Failed to rename workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, workspace.id, onAction]);

  const handleDelete = useCallback(async () => {
    try {
      setIsLoading(true);
      await deleteWorkspace({ id: workspace.id });
      setDeleteDialog(false);
      onAction(); // Refresh workspace list
      toast(`"${workspace.name}" was successfully deleted`);
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast("Failed to delete workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [workspace.id, workspace.name, onAction]);

  // Handle keyboard shortcuts for dialog
  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleRename();
    }
  }, [handleRename, isLoading]);

  const handleDuplicateWorkspace = useCallback(() => {
    toast("Duplicate workspace feature will be available soon!");
  }, []);

  const handleShareWorkspace = useCallback(() => {
    toast("Coming soon");
  }, []);

  const handleArchiveWorkspace = useCallback(() => {
    toast("Coming soon");
  }, []);

  return (
    <TooltipProvider>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* Action Button with Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Workspace options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={10}>
              <p className="text-xs">Workspace options</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              className="flex items-center cursor-pointer focus:bg-primary/5 focus:text-primary"
              onClick={() => setRenameDialog(true)}
            >
              <Edit className="h-4 w-4 mr-2" /> 
              <span>Rename</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="flex items-center cursor-pointer focus:bg-primary/5 focus:text-primary"
              onClick={handleDuplicateWorkspace}
            >
              <Copy className="h-4 w-4 mr-2" /> 
              <span>Duplicate</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="flex items-center cursor-pointer focus:bg-primary/5 focus:text-primary"
              onClick={handleShareWorkspace}
            >
              <Share className="h-4 w-4 mr-2" /> 
              <span>Share</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="flex items-center cursor-pointer focus:bg-primary/5 focus:text-primary"
              onClick={handleArchiveWorkspace}
            >
              <Archive className="h-4 w-4 mr-2" /> 
              <span>Archive</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="flex items-center text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
              onClick={() => setDeleteDialog(true)}
            >
              <Trash className="h-4 w-4 mr-2" /> 
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rename Dialog */}
        <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename Workspace</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Give your workspace a memorable name.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                placeholder="Workspace name"
                disabled={isLoading}
                onKeyDown={handleRenameKeyDown}
                aria-label="Workspace name"
              />
              <p className="text-xs text-muted-foreground mt-2">
                The workspace name will be visible to all team members.
              </p>
            </div>
            <DialogFooter className="mt-4 flex justify-between sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialog(false)}
                disabled={isLoading}
                className="focus:ring-2 focus:ring-primary/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleRename}
                disabled={isLoading || !name.trim() || name === workspace.name}
                className="focus:ring-2 focus:ring-primary/20"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Workspace?</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <span className="font-medium">"{workspace.name}"</span>?
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                <p className="text-sm text-red-800">
                  This action cannot be undone. All data associated with this workspace will be permanently deleted.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-4 flex justify-between sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialog(false)}
                disabled={isLoading}
                className="focus:ring-2 focus:ring-primary/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="focus:ring-2 focus:ring-red-700/20"
              >
                {isLoading ? "Deleting..." : "Delete Workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}