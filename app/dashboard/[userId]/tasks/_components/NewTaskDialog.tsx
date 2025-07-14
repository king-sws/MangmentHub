"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Form validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Custom hooks
import { useBoards } from "./useBoards";
import { useLists } from "./useLists";

// Task schema for validation
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  boardId: z.string().min(1, "Board is required"),
  listId: z.string().min(1, "List is required"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function NewTaskDialog({ open, onOpenChange, onTaskCreated }: NewTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Fetch available boards
  const { boards, isLoading: isBoardsLoading, error: boardsError } = useBoards();
  
  // Get form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      boardId: "",
      listId: "",
    },
  });
  
  // Watch boardId to fetch lists when it changes
  const selectedBoardId = form.watch("boardId");
  const { lists, isLoading: isListsLoading, error: listsError } = useLists(selectedBoardId);
  
  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset();
      setSubmitError(null);
      setIsCalendarOpen(false);
    }
  }, [open, form]);
  
  // Clear listId when board changes
  useEffect(() => {
    if (selectedBoardId) {
      form.setValue("listId", "");
    }
  }, [selectedBoardId, form]);
  
  // Handle form submission
  const onSubmit = async (values: TaskFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Prepare the payload
      const payload = {
        title: values.title,
        description: values.description || "",
        status: values.status,
        // Format date properly for API
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };
      
      const response = await fetch(`/api/lists/${values.listId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create task: ${response.status} ${errorText}`);
      }
      
      // Call the onTaskCreated callback to trigger a refetch in the parent component
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating task:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Pick a date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your task list.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Message */}
            {submitError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {submitError}
              </div>
            )}
            
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
                      disabled={isSubmitting}
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
                      placeholder="Task description (optional)" 
                      {...field} 
                      value={field.value || ""}
                      disabled={isSubmitting}
                      rows={3}
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
                    disabled={isSubmitting || isBoardsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a board" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Handle loading and error states */}
                      {isBoardsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading boards...
                        </SelectItem>
                      ) : boardsError ? (
                        <SelectItem value="error" disabled>
                          Error loading boards
                        </SelectItem>
                      ) : Array.isArray(boards) && boards.length > 0 ? (
                        boards.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-boards" disabled>
                          No boards available
                        </SelectItem>
                      )}
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
                    disabled={isSubmitting || isListsLoading || !selectedBoardId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a list" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Handle loading and error states */}
                      {isListsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading lists...
                        </SelectItem>
                      ) : listsError ? (
                        <SelectItem value="error" disabled>
                          Error loading lists
                        </SelectItem>
                      ) : !selectedBoardId ? (
                        <SelectItem value="no-board" disabled>
                          Please select a board first
                        </SelectItem>
                      ) : Array.isArray(lists) && lists.length > 0 ? (
                        lists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-lists" disabled>
                          No lists available
                        </SelectItem>
                      )}
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
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !field.value && "text-muted-foreground"
                          }`}
                          disabled={isSubmitting}
                          type="button"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(field.value)}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
  className="w-auto p-0 z-9999" 
  align="start"
  side="bottom"
  sideOffset={4}
>
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date("1900-01-01")}
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
                    disabled={isSubmitting}
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
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}