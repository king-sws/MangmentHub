/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createBoard } from "@/actions/createBoard";

interface CreateBoardButtonProps {
  workspaceId: string;
  disabled?: boolean;
  currentCount?: number;
  limit?: number;
  plan?: string;
}

export function CreateBoardButton({ 
  workspaceId, 
  disabled = false,
  currentCount = 0,
  limit = 0,
  plan = 'FREE'
}: CreateBoardButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const board = await createBoard({
        title: title.trim(),
        workspaceId,
      });
      
      toast.success('Board created!');
      if (board) {
        setTitle("");
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create board');
      setIsLoading(false);
    }
  };

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button variant="default" size="sm" disabled className="flex items-center bg-amber-500/80 hover:bg-amber-500">
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-amber-100 text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p>You've reached your board limit ({currentCount}/{limit}) on the {plan} plan.</p>
                <Link 
                  href="/settings/billing" 
                  className="text-primary hover:underline text-xs block mt-1"
                >
                  Upgrade to create more boards
                </Link>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="default" className="flex items-center bg-gradient-to-r from-primary to-primary/80">
        <Plus className="h-4 w-4 mr-2" />
        Create Board
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Board</DialogTitle>
            <DialogDescription>
              Boards help you organize and collaborate on work.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Board title</Label>
                <Input
                  id="title"
                  placeholder="Enter board title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  aria-required="true"
                />
              </div>
              {limit > 0 && (
                <div className="text-xs text-muted-foreground">
                  {currentCount} of {limit} boards used ({plan} plan)
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)} 
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!title.trim() || isLoading}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}