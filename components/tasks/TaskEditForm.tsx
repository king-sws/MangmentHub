/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Calendar, ArrowLeft, AlertCircle, Save, Trash2, X } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Form validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Custom hooks
import { useBoards } from "@/app/dashboard/[userId]/tasks/_components/useBoards";
import { useLists } from "@/app/dashboard/[userId]/tasks/_components/useLists";
import React from "react";

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  completed: boolean;
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

// Enhanced task schema with better validation
const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  dueDate: z.date().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  boardId: z.string().min(1, "Board selection is required"),
  listId: z.string().min(1, "List selection is required"),
  completed: z.boolean(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

// Constants
const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "bg-gray-100 text-gray-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  IN_REVIEW: { label: "In Review", color: "bg-yellow-100 text-yellow-800" },
  DONE: { label: "Done", color: "bg-green-100 text-green-800" },
} as const;

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Task form error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface TaskEditFormProps {
  taskId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskEditForm({ 
  taskId, 
  userId, 
  onSuccess, 
  onCancel 
}: TaskEditFormProps) {
  const router = useRouter();
  
  // State management
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Form setup with enhanced validation
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      completed: false,
      dueDate: null,
      boardId: "",
      listId: "",
    },
    mode: "onChange", // Real-time validation
  });
  
  // Watch for changes to detect unsaved modifications
  const formValues = form.watch();
  const selectedBoardId = form.watch("boardId");
  
  // Custom hooks
  const { boards, isLoading: isBoardsLoading, error: boardsError } = useBoards();
  const { lists, isLoading: isListsLoading, error: listsError } = useLists(selectedBoardId);
  
  // Memoized values with safety checks
  const isFormDisabled = useMemo(() => 
    isSaving || isDeleting || isLoading, 
    [isSaving, isDeleting, isLoading]
  );
  
  const currentStatus = form.watch("status");
  const statusConfig = STATUS_CONFIG[currentStatus];
  
  // Safe boards array - ensure it's always an array
  const safeBoards = useMemo(() => {
    if (!boards) return [];
    if (Array.isArray(boards)) return boards;
    // If boards is an object with a data property that's an array
    if (typeof boards === 'object' && Array.isArray((boards as any).data)) {
      return (boards as any).data;
    }
    // If boards is an object, try to convert it to array
    if (typeof boards === 'object') {
      return Object.values(boards).filter(Boolean);
    }
    return [];
  }, [boards]);
  
  // Safe lists array - ensure it's always an array
  const safeLists = useMemo(() => {
    if (!lists) return [];
    if (Array.isArray(lists)) return lists;
    // If lists is an object with a data property that's an array
    if (typeof lists === 'object' && Array.isArray((lists as any).data)) {
      return (lists as any).data;
    }
    // If lists is an object, try to convert it to array
    if (typeof lists === 'object') {
      return Object.values(lists).filter(Boolean);
    }
    return [];
  }, [lists]);
  
  // Load task data with error handling
  const fetchTask = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Task not found");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to edit this task");
        }
        throw new Error(`Failed to fetch task: ${response.statusText}`);
      }
      
      const taskData: Task = await response.json();
      setTask(taskData);
      
      // Populate form with existing data
      const formData: TaskFormValues = {
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status,
        completed: taskData.completed,
        boardId: taskData.list.board.id,
        listId: taskData.list.id,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      };
      
      form.reset(formData);
      
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load task details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [taskId, form]);
  
  // Track unsaved changes
  useEffect(() => {
    if (!task) return;
    
    const originalValues = {
      title: task.title,
      description: task.description || "",
      status: task.status,
      completed: task.completed,
      boardId: task.list.board.id,
      listId: task.list.id,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    };
    
    const hasChanges = JSON.stringify(formValues) !== JSON.stringify(originalValues);
    setHasUnsavedChanges(hasChanges);
  }, [formValues, task]);
  
  // Load initial data
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);
  
  // Handle board change - reset list selection
  useEffect(() => {
    if (selectedBoardId && task?.list.board.id !== selectedBoardId) {
      form.setValue("listId", "");
    }
  }, [selectedBoardId, form, task]);
  
  // Form submission with enhanced error handling
  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsSaving(true);
      
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status,
        listId: data.listId,
        dueDate: data.dueDate?.toISOString() || null,
        completed: data.completed,
      };
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update task");
      }
      
      const updatedTask = await response.json();
      setTask(updatedTask);
      setHasUnsavedChanges(false);
      
      toast.success("Task updated successfully");
      
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/${userId}/tasks/${taskId}`);
      }
      
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update task"
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete task with confirmation
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete task");
      }
      
      toast.success("Task deleted successfully");
      router.push(`/dashboard/${userId}/tasks`);
      
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  // Handle navigation with unsaved changes warning
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, onCancel, router]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading task details...</p>
      </div>
    );
  }
  
  // Error state
  if (!task) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Task not found or you don&lsquo;t have permission to edit it.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Something went wrong loading the task form. Please refresh the page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      }
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              disabled={isFormDisabled}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Unsaved changes
              </Badge>
            )}
          </div>
          
          {/* Title and Metadata */}
          <div className="space-y-2">
            <CardTitle className="text-2xl">Edit Task</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Created {format(new Date(task.createdAt), "MMM d, yyyy")}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Updated {format(new Date(task.updatedAt), "MMM d, yyyy")}</span>
              <Separator orientation="vertical" className="h-4" />
              <Badge className={statusConfig.color} variant="secondary">
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Display */}
          {(boardsError || listsError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(boardsError instanceof Error ? boardsError.message : boardsError) ||
                 (listsError instanceof Error ? listsError.message : listsError)}
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter task title" 
                          {...field} 
                          disabled={isFormDisabled}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a detailed description of the task" 
                          className="min-h-[120px] resize-none"
                          {...field} 
                          value={field.value || ""}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Organization */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Organization</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="boardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isFormDisabled || isBoardsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a board" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {safeBoards.map((board) => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {/* Debug information - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-muted-foreground">
                            Boards: {Array.isArray(boards) ? 'Array' : typeof boards} 
                            ({safeBoards.length} items)
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="listId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isFormDisabled || isListsLoading || !selectedBoardId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a list" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {safeLists.map((list) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {/* Debug information - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-muted-foreground">
                            Lists: {Array.isArray(lists) ? 'Array' : typeof lists} 
                            ({safeLists.length} items)
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Status and Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status & Timeline</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isFormDisabled}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[0]}`} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                                disabled={isFormDisabled}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Select date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => date < new Date("1900-01-01")}
                            />
                            <div className="p-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => field.onChange(null)}
                                className="w-full"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Clear date
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Completion Status */}
                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          Mark as completed
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This will mark the task as finished regardless of status
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isFormDisabled}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCancel}
                    disabled={isFormDisabled}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isFormDisabled || !form.formState.isValid}
                    className="flex-1 sm:flex-none"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone
              and will permanently remove the task and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}