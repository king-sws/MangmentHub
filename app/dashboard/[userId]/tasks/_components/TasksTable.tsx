"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { StatusBadge } from "./StatusBadge";
import { TasksTableFilters } from "./TasksTableFilters";
import { useTasksData } from "@/hooks/use-tasks-data";
import { formatDate } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TasksTableProps {
  userId: string;
}

export function TasksTable({ userId }: TasksTableProps) {
  const router = useRouter();
  const { data: tasks, isLoading, error, updateFilters, refetch } = useTasksData(userId);
  
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
    if (statuses.length === 1) {
      updateFilters({ status: statuses[0] });
    } else {
      updateFilters({ status: undefined });
    }
  };

  const handleAssigneeChange = (assignees: string[]) => {
    setSelectedAssignees(assignees);
    if (assignees.length === 1) {
      updateFilters({ assigneeId: assignees[0] });
    } else {
      updateFilters({ assigneeId: undefined });
    }
  };

  const handleProjectChange = (projects: string[]) => {
    setSelectedProjects(projects);
    if (projects.length === 1) {
      updateFilters({ projectId: projects[0] });
    } else {
      updateFilters({ projectId: undefined });
    }
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    updateFilters({ dueDate: date });
  };

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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tasks) {
    return (
      <div className="text-center py-10 text-muted-foreground">
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

  // Extract unique values for filters
  const uniqueStatuses = [...new Set(tasks.map((task) => task.status))];
  const uniqueAssignees = tasks.flatMap((task) => task.assignees)
    .filter((assignee, index, self) => 
      index === self.findIndex((a) => a.id === assignee.id)
    );
  const uniqueProjects = tasks.map((task) => task.list.board)
    .filter((board, index, self) => 
      index === self.findIndex((b) => b.id === board.id)
    );

  // Filter tasks based on selected filters (client-side filtering as backup)
  const filteredTasks = tasks.filter((task) => {
    // These filters should work alongside the server-side filters
    // for enhanced user experience
    
    // Filter by status
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
      return false;
    }

    // Filter by assignee
    if (
      selectedAssignees.length > 0 &&
      !task.assignees.some((assignee) => selectedAssignees.includes(assignee.id))
    ) {
      return false;
    }

    // Filter by project (board name)
    if (
      selectedProjects.length > 0 &&
      !selectedProjects.includes(task.list.board.id)
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <TasksTableFilters
        statuses={uniqueStatuses}
        assignees={uniqueAssignees}
        projects={uniqueProjects}
        selectedStatuses={selectedStatuses}
        selectedAssignees={selectedAssignees}
        selectedProjects={selectedProjects}
        dueDate={dueDate}
        onStatusChange={handleStatusChange}
        onAssigneeChange={handleAssigneeChange}
        onProjectChange={handleProjectChange}
        onDueDateChange={handleDueDateChange}
      />

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <span className="sr-only">Complete</span>
              </TableHead>
              <TableHead className="min-w-[150px]">Task Name</TableHead>
              <TableHead className="min-w-[150px]">Project</TableHead>
              <TableHead className="min-w-[150px]">Assignee</TableHead>
              <TableHead className="min-w-[120px]">Due Date</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="w-[70px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id} className={task.completed ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => 
                        handleCompleteTask(task.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-medium bg-blue-100 text-blue-800 p-1 rounded-md text-xs mr-2">
                        {task.list.board.title.charAt(0).toUpperCase()}
                      </span>
                      {task.list.board.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.assignees.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {task.assignees[0].name?.charAt(0).toUpperCase() || "U"}
                        </span>
                        <span>{task.assignees[0].name || "Unknown"}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span
                        className={
                          new Date(task.dueDate) < new Date() && !task.completed
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>
    </div>
  );
}