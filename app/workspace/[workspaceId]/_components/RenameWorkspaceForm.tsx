"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameWorkspace } from "@/actions/workspace";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface RenameWorkspaceFormProps {
  workspaceId: string;
  initialName: string;
}

export function RenameWorkspaceForm({ workspaceId, initialName }: RenameWorkspaceFormProps) {
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || name === initialName) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await renameWorkspace({
        id: workspaceId,
        name: name.trim(),
      });
      
      toast.success("Workspace renamed successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to rename workspace:", error);
      toast.error("Failed to rename workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRename} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Workspace Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace Name"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit"
          disabled={isLoading || !name.trim() || name === initialName}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}