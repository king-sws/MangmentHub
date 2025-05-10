"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Star, Pencil, Trash, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface BoardCardProps {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  isStarred?: boolean;
}

export function BoardCard({ id, title, createdAt, updatedAt, isStarred = false }: BoardCardProps) {
  const [starred, setStarred] = useState(isStarred);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Generate a consistent pastel color based on the board title
  const generateBackgroundColor = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      "from-blue-100 to-blue-50",
      "from-green-100 to-green-50",
      "from-purple-100 to-purple-50",
      "from-amber-100 to-amber-50",
      "from-pink-100 to-pink-50",
      "from-indigo-100 to-indigo-50",
      "from-red-100 to-red-50",
      "from-teal-100 to-teal-50",
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const bgGradient = generateBackgroundColor(title);
  
  // Format the date for display
  const getUpdatedTimeAgo = () => {
    if (!updatedAt) return "";
    return formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
  };

  const toggleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/board/${id}/star`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isStarred: !starred }),
      });

      if (!response.ok) {
        throw new Error("Failed to update star status");
      }

      setStarred(!starred);
      toast.success(starred ? "Board removed from starred" : "Board added to starred");
    } catch (error) {
      console.error("Error toggling star:", error);
      toast.error("Failed to update starred status");
    } finally {
      setIsLoading(false);
    }
  };

  const openInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/board/${id}`, '_blank');
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRenameDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };
  
  const confirmRename = async () => {
    if (newTitle.trim() === "") {
      toast.error("Board name cannot be empty");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/board/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename board");
      }

      toast.success("Board renamed successfully");
      router.refresh(); // Refresh the page to reflect changes
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming board:", error);
      toast.error("Failed to rename board");
    } finally {
      setIsLoading(false);
    }
  };
  
  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/board/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete board");
      }

      toast.success("Board deleted successfully");
      router.refresh(); // Refresh the page to reflect changes
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Failed to delete board");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Link href={`/board/${id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-all border group h-full">
          <div className={`h-28 bg-gradient-to-r ${bgGradient} p-3 relative`}>
            <div className="absolute top-3 right-3 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                onClick={toggleStar}
                disabled={isLoading}
              >
                <Star 
                  className={`h-4 w-4 ${starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} 
                />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={handleRename}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={openInNewTab}>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Open in new tab
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <CardContent className="p-3">
            <h3 className="font-medium truncate">{title}</h3>
          </CardContent>
          
          <CardFooter className="p-3 pt-0">
            <p className="text-xs text-muted-foreground">
              {updatedAt ? `Updated ${getUpdatedTimeAgo()}` : (
                createdAt ? `Created ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}` : ""
              )}
            </p>
            
            {starred && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={toggleStar}
                disabled={isLoading}
              >
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </Link>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
            <DialogDescription>
              Enter a new name for your board.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter board name"
              className="col-span-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  confirmRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRenameDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmRename}
              disabled={isLoading || !newTitle.trim()}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &rdquo;{title}&#34;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}