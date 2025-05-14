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
import { Loader2, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
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
import { NewTaskDialog } from "./NewTaskDialog";

interface TasksTableProps {
  userId: string;
}

export function TasksTable({ userId }: TasksTableProps) {
  const router = useRouter();
  const { data: tasks, isLoading, error, updateFilters, refetch } = useTasksData(userId);
  
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1); // Reset to first page when filters change
    if (statuses.length === 1) {
      updateFilters({ status: statuses[0] });
    } else {
      updateFilters({ status: undefined });
    }
  };

  const handleProjectChange = (projects: string[]) => {
    setSelectedProjects(projects);
    setCurrentPage(1); // Reset to first page when filters change
    if (projects.length === 1) {
      updateFilters({ projectId: projects[0] });
    } else {
      updateFilters({ projectId: undefined });
    }
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    setCurrentPage(1); // Reset to first page when filters change
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

  const handleNewTaskCreated = () => {
    // Refetch the tasks data immediately when a new task is created
    refetch();
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
  const uniqueProjects = tasks.map((task) => task.list.board)
    .filter((board, index, self) => 
      index === self.findIndex((b) => b.id === board.id)
    );

  // Filter tasks based on selected filters (client-side filtering as backup)
  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
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

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <TasksTableFilters
          statuses={uniqueStatuses}
          assignees={[]} // Empty array since you don't need assignees
          projects={uniqueProjects}
          selectedStatuses={selectedStatuses}
          selectedAssignees={[]} // Empty array
          selectedProjects={selectedProjects}
          dueDate={dueDate}
          onStatusChange={handleStatusChange}
          onAssigneeChange={() => {}} // Empty function
          onProjectChange={handleProjectChange}
          onDueDateChange={handleDueDateChange}
        />
        
        <Button onClick={() => setIsNewTaskDialogOpen(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="rounded-md border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <span className="sr-only">Complete</span>
              </TableHead>
              <TableHead className="min-w-[150px]">Task Name</TableHead>
              <TableHead className="min-w-[150px] hidden sm:table-cell">Project</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Due Date</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="w-[70px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              currentTasks.map((task) => (
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
                    <div>
                      {task.title}
                      
                      {/* Mobile-only project and due date info */}
                      <div className="block sm:hidden text-xs text-muted-foreground mt-1">
                        {task.list.board.title}
                      </div>
                      <div className="block md:hidden text-xs text-muted-foreground mt-1">
                        {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center">
                      <span className="font-medium bg-blue-100 text-blue-800 p-1 rounded-md text-xs mr-2">
                        {task.list.board.title.charAt(0).toUpperCase()}
                      </span>
                      {task.list.board.title}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} tasks
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Previous</span>
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only md:not-sr-only md:mr-2">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* New Task Dialog */}
      <NewTaskDialog 
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onTaskCreated={handleNewTaskCreated}
      />
    </div>
  );
}