/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Loader2, 
  Calendar, 
  ClipboardList, 
  ArrowLeft, 
  Clock, 
  UserCircle, 
  CheckCircle,
  Edit3,
  MoreHorizontal,
  AlertCircle,
  Flag,
  MessageSquare,
  Link2,
  Archive,
  Trash2,
  User,
  Tag,
  Activity,
  CalendarDays,
  Timer,
  Plus,
  Users,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./StatusBadge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface TaskDetailsProps {
  taskId: string;
  userId: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  order: number;
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
      workspace: {
        id: string;
        name: string;
      };
    };
  };
  assignees: Array<{
    id: string;
    name: string;
    email: string;
    image?: string;
  }>;
  tags?: string[];
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

const priorityConfig = {
  LOW: { 
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800", 
    icon: Flag, 
    label: "Low" 
  },
  MEDIUM: { 
    color: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800", 
    icon: Flag, 
    label: "Medium" 
  },
  HIGH: { 
    color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800", 
    icon: Flag, 
    label: "High" 
  },
  URGENT: { 
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800", 
    icon: AlertCircle, 
    label: "Urgent" 
  }
};

const statusConfig = {
  BACKLOG: { label: "Backlog", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  TODO: { label: "To Do", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  IN_REVIEW: { label: "In Review", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  DONE: { label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" }
};

export function TaskDetails({ taskId, userId }: TaskDetailsProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/tasks/${taskId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Task not found");
          } else if (response.status === 401) {
            throw new Error("You don't have permission to view this task");
          } else {
            throw new Error("Failed to fetch task details");
          }
        }
        
        const data = await response.json();
        setTask(data);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(err instanceof Error ? err.message : "Failed to load task details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleCompleteTask = async () => {
    if (!task || isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      
      const updatedTask = await response.json();
      setTask(updatedTask);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || isDeleting) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      
      // Navigate back to tasks list
      router.push(`/dashboard/${userId}/tasks`);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = () => {
    if (task?.completed) return 100;
    if (task?.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter((sub: any) => sub.completed).length;
      return Math.round((completed / task.subtasks.length) * 100);
    }
    return 0;
  };

  const refreshTask = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error("Failed to refresh task");
      const data = await response.json();
      setTask(data);
    } catch (err) {
      setError("Failed to refresh task details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground font-medium">Loading task details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Task Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  {error || "The task you're looking for doesn't exist or has been deleted."}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => router.push(`/dashboard/${userId}/tasks`)}
                    variant="outline"
                  >
                    Back to Tasks
                  </Button>
                  {error && (
                    <Button onClick={refreshTask} variant="default">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !task.completed;
  const priority = task.priority || 'MEDIUM';
  const PriorityIcon = priorityConfig[priority]?.icon || Flag;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.back()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{task.list.board.title}</span>
                  <span>/</span>
                  <span>{task.list.title}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/${userId}/tasks/${taskId}/edit`)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <Button 
                  variant={task.completed ? "outline" : "default"}
                  size="sm"
                  onClick={handleCompleteTask}
                  disabled={isUpdating}
                  className={task.completed 
                    ? "" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
                  }
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {task.completed ? "Completed" : "Mark Complete"}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Task
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task
                            "{task.title}" and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteTask}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Task"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border-destructive/20 border-b">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <Badge className={statusConfig[task.status as keyof typeof statusConfig]?.color}>
                        {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                      </Badge>
                      {task.completed && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn("font-medium", priorityConfig[priority]?.color)}
                      >
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {priorityConfig[priority]?.label}
                      </Badge>
                    </div>
                    
                    {isOverdue && (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {Math.abs(daysUntilDue!)} days overdue
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className={cn(
                    "text-2xl font-semibold mb-4 leading-tight",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h1>
                  
                  {/* Progress Bar */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{getProgressPercentage()}%</span>
                      </div>
                      <Progress 
                        value={getProgressPercentage()} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {task.description || (
                            <span className="text-muted-foreground italic">No description provided</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Activity/Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Card className="bg-muted/50">
                          <CardContent className="p-3">
                            <p className="text-sm text-muted-foreground">Task created</p>
                          </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Add comment placeholder */}
                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Button variant="outline" className="w-full justify-start text-muted-foreground h-9">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add a comment...
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Task Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Task Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Assignees */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center">
                      <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      Assignees
                    </h3>
                    
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="space-y-2">
                        {task.assignees.map((assignee) => (
                          <div key={assignee.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignee.image || ""} alt={assignee.name} />
                              <AvatarFallback className="bg-muted">
                                {assignee.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{assignee.name}</p>
                              <p className="text-xs text-muted-foreground">{assignee.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No assignees</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Plus className="h-4 w-4 mr-1" />
                          Assign someone
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Due Date */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                      Due Date
                    </h3>
                    
                    {task.dueDate ? (
                      <div className="space-y-2">
                        <Card className={cn(
                          "p-3",
                          isOverdue 
                            ? "bg-destructive/5 border-destructive/20" 
                            : daysUntilDue !== null && daysUntilDue <= 3 
                              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30"
                              : "bg-muted/50"
                        )}>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <p className="font-medium">
                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </p>
                              <p className={cn(
                                "text-xs",
                                isOverdue && "text-destructive"
                              )}>
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue!)} days overdue`
                                  : daysUntilDue === 0 
                                    ? "Due today" 
                                    : daysUntilDue === 1 
                                      ? "Due tomorrow"
                                      : `Due in ${daysUntilDue} days`
                                }
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No due date set</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Plus className="h-4 w-4 mr-1" />
                          Add due date
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Created Date */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      Created
                    </h3>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <div>
                        <p className="text-sm">
                          {format(new Date(task.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs">
                          {format(new Date(task.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}