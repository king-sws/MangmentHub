/* eslint-disable react/no-unescaped-entities */
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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

// Schema for workspace settings
const workspaceFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

type WorkspaceData = {
  id: string;
  name: string;
  description?: string;
  isOwner: boolean;
};

export function WorkspaceSettings({ workspaceId }: { workspaceId: string }) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch workspace details
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch workspace details");
        }
        
        const data = await res.json();
        
        // Fetch user role separately
        const roleRes = await fetch(`/api/workspaces/${workspaceId}/role`);
        const roleData = await roleRes.json();
        
        setWorkspace(data.workspace);
        setUserRole(roleData.role);
        
        // Update form with fetched data
        reset({
          name: data.workspace.name,
          description: data.workspace.description || "",
        });
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setError("Failed to load workspace data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkspace();
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
        throw new Error("Failed to update workspace");
      }
      
      const updatedWorkspace = await res.json();
      setWorkspace(updatedWorkspace);
      
      toast.success("Workspace settings updated successfully");
    } catch (err) {
      console.error("Error updating workspace:", err);
      toast.error("Failed to update workspace settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle workspace deletion
  const handleDeleteWorkspace = async () => {
    try {
      setIsSaving(true);
      
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete workspace");
      }
      
      toast.success("Workspace deleted successfully");
      window.location.href = "/dashboard"; // Redirect to dashboard
    } catch (err) {
      console.error("Error deleting workspace:", err);
      toast.error("Failed to delete workspace");
      setDeleteDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-4 sm:py-6">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 p-3 sm:p-4 rounded-md border border-red-200 dark:bg-red-900/20 dark:border-red-900/50">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm sm:text-base text-red-600 dark:text-red-400">{error}</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-2 text-xs sm:text-sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Show no access message
  if (!workspace || (userRole !== "OWNER" && userRole !== "ADMIN")) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
        You don't have permission to manage this workspace's settings.
      </div>
    );
  }

  // Render the form
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Workspace Settings</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your workspace details and preferences.
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Workspace Name"
              {...register("name")}
              aria-invalid={!!errors.name}
              className="text-sm sm:text-base"
            />
            {errors.name && (
              <p className="text-xs sm:text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this workspace"
              className="resize-none h-20 sm:h-24 text-sm sm:text-base"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs sm:text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full sm:w-auto text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Save Changes
              </>
            )}
          </Button>
          
          {userRole === "OWNER" && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto text-sm">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the workspace
                    and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteWorkspace}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Workspace"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
      
      {userRole === "OWNER" && (
        <Card className="mt-6 sm:mt-8 border-dashed border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/30">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-red-600 dark:text-red-400 text-base sm:text-lg">Danger Zone</CardTitle>
            <CardDescription className="text-red-500 dark:text-red-300 text-xs sm:text-sm">
              Actions here can't be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 py-2 sm:py-3">
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
              Deleting this workspace will remove all associated data, including all
              members, invitations, and content.
            </p>
          </CardContent>
          <CardFooter className="p-3 sm:p-4 pt-0 sm:pt-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto text-xs sm:text-sm">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the workspace
                    and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteWorkspace}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                  >
                    Delete Workspace
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}