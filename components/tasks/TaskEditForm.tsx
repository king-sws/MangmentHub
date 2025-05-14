"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Calendar, ArrowLeft, AlertCircle } from "lucide-react";

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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBoards } from "@/app/dashboard/[userId]/tasks/_components/useBoards";
import { useLists } from "@/app/dashboard/[userId]/tasks/_components/useLists";

// Custom hooks


// Task schema for validation
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  boardId: z.string().min(1, "Board is required"),
  listId: z.string().min(1, "List is required"),
  completed: z.boolean(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskEditFormProps {
  taskId: string;
  userId: string;
}

export function TaskEditForm({ taskId, userId }: TaskEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form setup
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
  });
  
  // Watch for board changes to load lists
  const selectedBoardId = form.watch("boardId");
  const { boards, isLoading: isBoardsLoading } = useBoards();
  const { lists, isLoading: isListsLoading } = useLists(selectedBoardId);
  
  // Load task data
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch task");
        }
        
        const taskData = await response.json();
        
        // Set form values
        form.setValue("title", taskData.title);
        form.setValue("description", taskData.description || "");
        form.setValue("status", taskData.status);
        form.setValue("completed", taskData.completed);
        form.setValue("boardId", taskData.list.board.id);
        form.setValue("listId", taskData.list.id);
        
        if (taskData.dueDate) {
          form.setValue("dueDate", new Date(taskData.dueDate));
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId, form]);
  
  // Handle form submission
  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Prepare data for API
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status,
        listId: data.listId,
        dueDate: data.dueDate,
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
        throw new Error("Failed to update task");
      }
      
      setSuccessMessage("Task updated successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/${userId}/tasks/${taskId}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const onDelete = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      
      router.push(`/dashboard/${userId}/tasks`);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task. Please try again.");
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <CardTitle>Edit Task</CardTitle>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Task title" 
                      {...field} 
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Task description" 
                      className="min-h-[120px]"
                      {...field} 
                      value={field.value || ""}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Board Selection */}
            <FormField
              control={form.control}
              name="boardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isSaving || isBoardsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a board" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {boards?.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* List Selection */}
            <FormField
              control={form.control}
              name="listId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isSaving || isListsLoading || !selectedBoardId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a list" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lists?.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !field.value && "text-muted-foreground"
                          }`}
                          disabled={isSaving}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "No due date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Completed Checkbox */}
            <FormField
              control={form.control}
              name="completed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as completed</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <CardFooter className="flex justify-between px-0 pt-4">
              <Button
                variant="destructive"
                type="button"
                onClick={onDelete}
                disabled={isSaving}
              >
                Delete Task
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}