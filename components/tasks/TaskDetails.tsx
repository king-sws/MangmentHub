/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Calendar, ClipboardList, ArrowLeft, Clock, UserCircle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "../StatusBadge";

interface TaskDetailsProps {
  taskId: string;
  userId: string;
}

export function TaskDetails({ taskId, userId }: TaskDetailsProps) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    if (!task) return;
    
    try {
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>{error || "Task not found"}</p>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/${userId}/tasks`)} 
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/${userId}/tasks/${taskId}/edit`)}
            >
              Edit Task
            </Button>
            <Button 
              variant={task.completed ? "outline" : "default"}
              onClick={handleCompleteTask}
            >
              {task.completed ? "Mark Incomplete" : "Mark Complete"}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <StatusBadge status={task.status} />
          {task.completed && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </span>
          )}
        </div>
        
        <CardTitle className={`text-2xl mt-2 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </CardTitle>
        
        <CardDescription className="flex items-center gap-2 mt-1">
          <ClipboardList className="h-4 w-4" />
          {task.list.board.title} / {task.list.title}
        </CardDescription>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <div className="text-muted-foreground whitespace-pre-wrap min-h-[100px] p-4 bg-muted/30 rounded-lg">
                {task.description || "No description provided"}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Due Date */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Due Date
              </h3>
              <p className={`${new Date(task.dueDate) < new Date() && !task.completed ? "text-red-500 font-medium" : ""}`}>
                {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
              </p>
            </div>
            
            {/* Created At */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Created
              </h3>
              <p className="text-muted-foreground">
                {format(new Date(task.createdAt), "PPP")}
              </p>
            </div>
            
            {/* Assignees */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                Assignees
              </h3>
              
              {task.assignees && task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee: any) => (
                    <div key={assignee.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.image || ""} alt={assignee.name} />
                        <AvatarFallback>{assignee.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No assignees</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}