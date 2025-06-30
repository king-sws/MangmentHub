// components/BoardSettingsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Check } from "lucide-react";
import { toast } from "sonner";

interface Board {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

interface BoardSettingsFormProps {
  board: Board;
}

export function BoardSettingsForm({ board }: BoardSettingsFormProps) {
  const [title, setTitle] = useState(board.title);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast("Board title cannot be empty");
      return;
    }

    if (title === board.title) {
      toast("No changes");
      return;
    }

    setIsLoading(true);
    setIsSaved(false);

    try {
      const response = await fetch(`/api/board/${board.id}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update board");
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

      toast("Board settings updated successfully");

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating board:", error);
      toast("Failed to update board settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Board Name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter board name"
          className="max-w-md"
          disabled={isLoading}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This name will be displayed in your workspace and board header.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <Button 
          type="submit" 
          disabled={isLoading || title === board.title}
          className="min-w-[100px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>

        {title !== board.title && (
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setTitle(board.title)}
            disabled={isLoading}
          >
            Reset
          </Button>
        )}
      </div>

      {title !== board.title && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          You have unsaved changes
        </p>
      )}
    </form>
  );
}