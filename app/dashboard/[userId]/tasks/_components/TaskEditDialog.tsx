"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  Calendar, 
  Save, 
  X, 
  Check, 
  User,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { CardStatus } from "@prisma/client";
import { format } from "date-fns";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface List {
  id: string;
  title: string;
  board: {
    id: string;
    title: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: CardStatus;
  completed: boolean;
  dueDate: string | null;
  listId: string;
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
  assignees: User[];
  createdAt: string;
  updatedAt: string;
}

interface TaskEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
  onTaskUpdated?: () => void;
  lists: List[];
  workspaceMembers: User[];
}

export function TaskEditDialog({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated,
  lists,
  workspaceMembers
}: TaskEditDialogProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CardStatus>("TODO");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [listId, setListId] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      
      try {
        setIsLoadingTask(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }
        
        const data = await response.json();
        setTask(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
        setDueDate(data.dueDate ? new Date(data.dueDate) : null);
        setListId(data.listId);
        setAssigneeIds(data.assignees.map((a: User) => a.id));
        setCompleted(data.completed);
      } catch (error) {
        console.error("Error fetching task:", error);
        toast.error("Failed to load task details");
      } finally {
        setIsLoadingTask(false);
      }
    };

    if (isOpen && taskId) {
      fetchTask();
    } else {
      // Reset form when dialog closes
      setTask(null);
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setDueDate(null);
      setListId("");
      setAssigneeIds([]);
      setCompleted(false);
    }
  }, [isOpen, taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    if (!listId) {
      toast.error("Please select a list");
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          completed,
          dueDate: dueDate ? dueDate.toISOString() : null,
          listId,
          assigneeIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      
      toast.success("Task updated successfully");
      onClose();
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeToggle = (userId: string) => {
    setAssigneeIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: CardStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "DONE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        {isLoadingTask ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-600 dark:text-gray-400">Loading task details...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-900 dark:text-gray-100">
                Edit Task
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Update task details and make changes to its status.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="title" 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
                  >
                    Title *
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    required
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor="description" 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description"
                    rows={4}
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="status" 
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
                    >
                      Status
                    </label>
                    <Select 
                      value={status} 
                      onValueChange={(value: CardStatus) => setStatus(value)}
                    >
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        <SelectItem value="TODO" className="text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-sm py-1 px-2", getStatusColor("TODO"))}>
                              To Do
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS" className="text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-sm py-1 px-2", getStatusColor("IN_PROGRESS"))}>
                              In Progress
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="DONE" className="text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-sm py-1 px-2", getStatusColor("DONE"))}>
                              Done
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="IN_REVIEW" className="text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-sm py-1 px-2", getStatusColor("IN_REVIEW"))}>
                              IN_REVIEW
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="listId" 
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
                    >
                      List *
                    </label>
                    <Select 
                      value={listId} 
                      onValueChange={setListId}
                    >
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder="Select list" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 max-h-[200px]">
                        {lists.map((list) => (
                          <SelectItem 
                            key={list.id} 
                            value={list.id}
                            className="text-gray-900 dark:text-gray-100"
                          >
                            {list.title} - {list.board.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="dueDate" 
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
                    >
                      Due Date
                    </label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                            !dueDate && "text-gray-500 dark:text-gray-400"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800">
                        <CalendarComponent
                          mode="single"
                          selected={dueDate || undefined}
                          onSelect={(date) => {
                            setDueDate(date ?? null);
                            setIsDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                        {dueDate && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDueDate(null);
                                setIsDatePickerOpen(false);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Clear
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setIsDatePickerOpen(false)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Apply
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="completed"
                        checked={completed}
                        onChange={(e) => setCompleted(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      <label 
                        htmlFor="completed" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Mark as completed
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                  >
                    Assignees
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-700">
                    {workspaceMembers.length === 0 ? (
                      <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        No workspace members available
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {workspaceMembers.map((member) => (
                          <div
                            key={member.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors",
                              assigneeIds.includes(member.id) && "bg-blue-50 dark:bg-blue-900/20"
                            )}
                            onClick={() => handleAssigneeToggle(member.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {member.image ? (
                                  <AvatarImage src={member.image} alt={member.name || member.email} />
                                ) : (
                                  <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs">
                                    {getInitials(member.name, member.email)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {member.name || member.email}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <div 
                                className={cn(
                                  "w-5 h-5 rounded-sm border border-gray-300 dark:border-gray-600 flex items-center justify-center",
                                  assigneeIds.includes(member.id) && "bg-primary border-primary"
                                )}
                              >
                                {assigneeIds.includes(member.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {task && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>Created: {format(new Date(task.createdAt), "PPp")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>Last updated: {format(new Date(task.updatedAt), "PPp")}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={onClose}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}