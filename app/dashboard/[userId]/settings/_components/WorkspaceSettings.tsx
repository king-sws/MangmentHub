"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Loader2,
  Save,
  Trash2,
  AlertCircle,
  Settings2,
  Building2,
  Shield,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Enhanced schema with better validation
const workspaceFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Name can only contain letters, numbers, spaces, hyphens and underscores"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

type WorkspaceData = {
  id: string;
  name: string;
  description?: string;
  isOwner: boolean;
  createdAt?: string;
  memberCount?: number;
  planType?: 'FREE' | 'PRO' | 'ENTERPRISE';
};

interface WorkspaceSettingsProps {
  workspaceId: string;
}

export function WorkspaceSettings({ workspaceId }: WorkspaceSettingsProps) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const watchedName = watch("name");
  const watchedDescription = watch("description");

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [workspaceRes, roleRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}`),
          fetch(`/api/workspaces/${workspaceId}/role`)
        ]);
        
        if (!workspaceRes.ok) {
          throw new Error("Failed to fetch workspace details");
        }
        
        const workspaceData = await workspaceRes.json();
        const roleData = await roleRes.json();
        
        setWorkspace(workspaceData.workspace);
        setUserRole(roleData.role);
        
        reset({
          name: workspaceData.workspace.name,
          description: workspaceData.workspace.description || "",
        });
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setError("Failed to load workspace data. Please refresh and try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId, reset]);

  // Handle form submission
  const onSubmit = async (data: WorkspaceFormValues) => {
    try {
      setIsSaving(true);
      
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update workspace");
      }
      
      const updatedWorkspace = await res.json();
      setWorkspace(updatedWorkspace.workspace);
      
      toast.success("Workspace updated successfully", {
        description: "Your changes have been saved."
      });
      
      // Reset form dirty state
      reset(data);
    } catch (err) {
      console.error("Error updating workspace:", err);
      toast.error("Failed to update workspace", {
        description: err instanceof Error ? err.message : "Please try again later."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle workspace deletion
  const handleDeleteWorkspace = async () => {
    if (confirmationText !== workspace?.name) {
      toast.error("Confirmation text doesn't match workspace name");
      return;
    }

    try {
      setIsDeleting(true);
      
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete workspace");
      }
      
      toast.success("Workspace deleted", {
        description: "The workspace and all its data have been permanently removed."
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      console.error("Error deleting workspace:", err);
      toast.error("Failed to delete workspace", {
        description: err instanceof Error ? err.message : "Please try again later."
      });
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPlanBadge = (planType?: string) => {
    switch (planType) {
      case 'FREE':
        return <Badge variant="secondary" className="text-xs">Free</Badge>;
      case 'PRO':
        return <Badge variant="default" className="text-xs bg-blue-600">Pro</Badge>;
      case 'ENTERPRISE':
        return <Badge variant="default" className="text-xs bg-purple-600">Enterprise</Badge>;
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading workspace settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-destructive">Unable to load workspace</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Permission check
  if (!workspace || (userRole !== "OWNER" && userRole !== "ADMIN")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You need administrator permissions to manage workspace settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOwner = userRole === "OWNER";
  const canDelete = isOwner && workspace.memberCount === 1; // Only allow deletion if owner and no other members

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
                {getPlanBadge(workspace.planType)}
              </div>
              <p className="text-muted-foreground">
                Manage workspace settings and preferences
              </p>
              {workspace.createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Badge variant={isOwner ? "default" : "secondary"} className="text-xs">
            {isOwner ? "Owner" : "Admin"}
          </Badge>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>
            Update your workspace name and description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Workspace Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter workspace name"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {watchedName?.length || 0}/50 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Help team members understand the workspace purpose</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this workspace (optional)"
                  className={`resize-none h-24 ${errors.description ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("description")}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {watchedDescription?.length || 0}/500 characters
                </p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            onClick={handleSubmit(onSubmit)}
            className="ml-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone - Only for owners */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <h4 className="font-medium text-sm mb-2">Delete Workspace</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Once deleted, this workspace and all its data will be permanently removed. 
                This action cannot be undone.
              </p>
              {!canDelete && workspace.memberCount && workspace.memberCount > 1 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md mb-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You must remove all other members before deleting this workspace.
                    Current members: {workspace.memberCount}
                  </p>
                </div>
              )}
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={!canDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Delete Workspace
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        This will permanently delete <strong>{workspace.name}</strong> and 
                        all of its data, including:
                      </p>
                      <ul className="text-sm list-disc list-inside space-y-1 ml-4">
                        <li>All workspace content</li>
                        <li>Member access and permissions</li>
                        <li>Integration settings</li>
                        <li>Usage history and analytics</li>
                      </ul>
                      <p className="font-medium text-destructive">
                        This action cannot be undone.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="confirmation" className="text-sm font-medium">
                        Type <code className="bg-muted px-1 py-0.5 rounded text-xs">{workspace.name}</code> to confirm:
                      </Label>
                      <Input
                        id="confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Enter workspace name"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      onClick={() => {
                        setConfirmationText("");
                        setDeleteDialogOpen(false);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteWorkspace}
                      disabled={confirmationText !== workspace.name || isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Workspace
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}