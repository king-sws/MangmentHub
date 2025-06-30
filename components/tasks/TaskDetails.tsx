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
  Timer
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
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "../StatusBadge";

interface TaskDetailsProps {
  taskId: string;
  userId: string;
}

const priorityConfig = {
  low: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Flag, label: "Low" },
  medium: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Flag, label: "Medium" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: Flag, label: "High" },
  urgent: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Urgent" }
};

export function TaskDetails({ taskId, userId }: TaskDetailsProps) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }
        
        const data = await response.json();
        setTask(data);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const handleCompleteTask = async () => {
    if (!task || isUpdating) return;
    
    try {
      setIsUpdating(true);
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

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = () => {
    if (task?.completed) return 100;
    if (task?.subtasks) {
      const completed = task.subtasks.filter((sub: any) => sub.completed).length;
      return Math.round((completed / task.subtasks.length) * 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto" />
              <p className="text-slate-600 font-medium">Loading task details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-sm border p-12 max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Task Not Found</h3>
              <p className="text-slate-600 mb-6">{error || "The task you're looking for doesn't exist or has been deleted."}</p>
              <Button 
                onClick={() => router.push(`/dashboard/${userId}/tasks`)}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Back to Tasks
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !task.completed;
  const priority = task.priority || 'medium';
  const PriorityIcon = priorityConfig[priority as keyof typeof priorityConfig]?.icon || Flag;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50/50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.back()}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <div className="h-6 w-px bg-slate-200" />
                
                <div className="flex items-center space-x-2 text-sm text-slate-600">
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
                  className="text-slate-700 border-slate-300 hover:bg-slate-50"
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
                    ? "text-slate-700 border-slate-300 hover:bg-slate-50" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : task.completed ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {task.completed ? "Completed" : "Mark Complete"}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-slate-700 border-slate-300">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-slate-700">
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-700">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Task
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Header Card */}
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={task.status} />
                      {task.completed && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`${priorityConfig[priority as keyof typeof priorityConfig]?.color} font-medium`}
                      >
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {priorityConfig[priority as keyof typeof priorityConfig]?.label}
                      </Badge>
                    </div>
                    
                    {isOverdue && (
                      <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {Math.abs(daysUntilDue!)} days overdue
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className={`text-2xl font-semibold text-slate-900 mb-4 leading-tight ${
                    task.completed ? "line-through text-slate-500" : ""
                  }`}>
                    {task.title}
                  </h1>
                  
                  {/* Progress Bar */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Progress</span>
                        <span className="text-sm text-slate-600">{getProgressPercentage()}%</span>
                      </div>
                      <Progress 
                        value={getProgressPercentage()} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="prose prose-slate max-w-none">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {task.description || (
                          <span className="text-slate-500 italic">No description provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity/Comments Section */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-slate-600" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-100 text-slate-600">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <p className="text-sm text-slate-600">Task created</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Add comment placeholder */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-slate-100 text-slate-600">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Button variant="outline" className="w-full justify-start text-slate-500 h-9">
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
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Task Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Assignees */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                      <UserCircle className="h-4 w-4 mr-2 text-slate-600" />
                      Assignees
                    </h3>
                    
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="space-y-2">
                        {task.assignees.map((assignee: any) => (
                          <div key={assignee.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignee.image || ""} alt={assignee.name} />
                              <AvatarFallback className="bg-slate-100 text-slate-600">
                                {assignee.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{assignee.name}</p>
                              <p className="text-xs text-slate-500">{assignee.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <UserCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No assignees</p>
                        <Button variant="outline" size="sm" className="mt-2 text-slate-600">
                          Assign someone
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-slate-200" />
                  
                  {/* Due Date */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-slate-600" />
                      Due Date
                    </h3>
                    
                    {task.dueDate ? (
                      <div className="space-y-2">
                        <div className={`flex items-center space-x-2 p-3 rounded-lg border ${
                          isOverdue 
                            ? "bg-red-50 border-red-200 text-red-700" 
                            : daysUntilDue !== null && daysUntilDue <= 3 
                              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}>
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs">
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
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No due date set</p>
                        <Button variant="outline" size="sm" className="mt-2 text-slate-600">
                          Add due date
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-slate-200" />
                  
                  {/* Created Date */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-slate-600" />
                      Created
                    </h3>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Timer className="h-4 w-4" />
                      <div>
                        <p className="text-sm">
                          {format(new Date(task.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(task.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <>
                      <Separator className="bg-slate-200" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-slate-600" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-slate-700 border-slate-300">
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