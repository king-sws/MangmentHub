/* eslint-disable @typescript-eslint/no-explicit-any */
// components/chat/CreateChatRoomDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChatRoom } from "@/types/chat";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateChatRoomDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: ChatRoom) => void;
}

export default function CreateChatRoomDialog({
  workspaceId,
  isOpen,
  onClose,
  onRoomCreated
}: CreateChatRoomDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null);
  const [isCheckingWorkspace, setIsCheckingWorkspace] = useState(false);

  // Check workspace membership when dialog opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      checkWorkspace();
    }
  }, [isOpen, workspaceId]);

  const checkWorkspace = async () => {
    try {
      setIsCheckingWorkspace(true);
      setError("");
      
      console.log(`Checking workspace access for ID: ${workspaceId}`);
      
      // First, try a direct API check to the workspace endpoint
      const directCheck = await fetch(`/api/workspaces/${workspaceId}`);
      if (directCheck.ok) {
        console.log("Direct workspace check successful");
        setWorkspaceInfo({ workspace: true, diagnostics: { exactMatchInUserWorkspaces: true } });
        setIsCheckingWorkspace(false);
        return;
      }
      
      // If direct check fails, use the diagnostics endpoint as fallback
      console.log("Direct check failed, trying diagnostics");
      const response = await fetch(`/api/debug/workspace-diagnostics?workspaceId=${workspaceId}`);
      const data = await response.json();
      
      console.log("Workspace diagnostics:", data);
      setWorkspaceInfo(data);
      
      if (!data.workspace) {
        setError(`Workspace not found: ${data.diagnostics?.requestedId || workspaceId}`);
      } else if (!data.diagnostics?.exactMatchInUserWorkspaces && !data.diagnostics?.membershipExists) {
        setError("You don't have access to this workspace");
      }
    } catch (err) {
      console.error("Error checking workspace:", err);
      setError("Failed to check workspace access");
    } finally {
      setIsCheckingWorkspace(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Room name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log(`Creating room in workspace: ${workspaceId}`);
      console.log("Form data:", formData);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || "Failed to create chat room";
        console.error(`Error creating room: ${errorMessage}`);
        
        // Show workspace ID in the error for debugging
        if (responseData.workspaceId) {
          throw new Error(`${errorMessage} for workspace ${responseData.workspaceId}`);
        } else {
          throw new Error(errorMessage);
        }
      }

      onRoomCreated(responseData);
      resetForm();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
      console.error("Error creating chat room:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isPrivate: false
    });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canCreateRoom = workspaceInfo && (
    workspaceInfo.workspace ||
    workspaceInfo.diagnostics?.exactMatchInUserWorkspaces || 
    workspaceInfo.diagnostics?.membershipExists
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isCheckingWorkspace ? (
          <div className="py-4 text-center">Checking workspace access...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {workspaceInfo && !canCreateRoom && (
              <Alert className="mb-4">
                <AlertDescription>
                  <div className="font-medium">Cannot access workspace</div>
                  <div>Workspace ID: {workspaceId}</div>
                  {workspaceInfo.diagnostics?.userWorkspaceCount > 0 && (
                    <div className="mt-2">
                      <p>You have access to these workspaces:</p>
                      <ul className="list-disc pl-5 mt-1">
                        {workspaceInfo.userWorkspaces?.map((w: any) => (
                          <li key={w.id}>{w.name} ({w.id})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter room name"
                disabled={isSubmitting || !canCreateRoom}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this chat room"
                disabled={isSubmitting || !canCreateRoom}
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                disabled={isSubmitting || !canCreateRoom}
              />
              <Label htmlFor="private">Private Room</Label>
            </div>

            <DialogFooter className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !canCreateRoom}
              >
                {isSubmitting ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}