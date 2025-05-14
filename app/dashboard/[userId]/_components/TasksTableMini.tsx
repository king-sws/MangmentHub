"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useTasksData } from "@/hooks/use-tasks-data";
import { formatDate } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TasksTableMiniProps {
  userId: string;
  limit?: number;
}

export function TasksTableMini({ userId, limit = 5 }: TasksTableMiniProps) {
  const router = useRouter();
  const { data: tasks, isLoading, error, refetch } = useTasksData(userId);
  
  // Show only the newest/upcoming tasks
  const filteredTasks = tasks
    ?.filter(task => !task.completed)
    .sort((a, b) => {
      // First prioritize tasks with due dates
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Then sort by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // For tasks without due dates, show newest tasks first
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .slice(0, limit);

  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      });
      
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tasks) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Error loading tasks. Please try again.</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if ((filteredTasks ?? []).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No upcoming tasks</p>
        <Button className="bg-indigo-400 hover:bg-indigo-500" asChild>
          <Link href={`/dashboard/${userId}/tasks/new`}>
            Create a new task
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <span className="sr-only">Complete</span>
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="hidden md:table-cell">Project</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(filteredTasks ?? []).map((task) => (
            <TableRow key={task.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => 
                    handleCompleteTask(task.id, checked === true)
                  }
                />
              </TableCell>
              <TableCell className="font-medium max-w-[200px] truncate">
                {task.title}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center max-w-[150px]">
                  <span className="font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 p-1 rounded-md text-xs mr-2">
                    {task.list.board.title.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{task.list.board.title}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {task.dueDate ? (
                  <span
                    className={
                      new Date(task.dueDate) < new Date() 
                        ? "text-red-500 font-medium"
                        : ""
                    }
                  >
                    {formatDate(task.dueDate)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={task.status} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/${userId}/tasks/${task.id}`)}>
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/${userId}/tasks/${task.id}/edit`)}>
                      Edit task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}