/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
import { 
  Loader2, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Filter,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  
  RefreshCw
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { TasksTableFilters } from "./TasksTableFilters";
import { useTasksData } from "@/hooks/use-tasks-data";
import { formatDate } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NewTaskDialog } from "./NewTaskDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TasksTableProps {
  userId: string;
}

export function TasksTable({ userId }: TasksTableProps) {
  const router = useRouter();
  const { data: tasks, isLoading, error, updateFilters, refetch, updateTaskInState } = useTasksData(userId);
  
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(25);
  
  // Selection state for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Enhanced filter handlers with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchQuery || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, updateFilters]);

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1);
    updateFilters({ 
      status: statuses.length === 1 ? statuses[0] : undefined 
    });
  };

  const handleProjectChange = (projects: string[]) => {
    setSelectedProjects(projects);
    setCurrentPage(1);
    updateFilters({ 
      projectId: projects.length === 1 ? projects[0] : undefined 
    });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    setCurrentPage(1);
    updateFilters({ dueDate: date });
  };


const handleCompleteTask = async (taskId: string, completed: boolean) => {
  try {
    // Get the current task to preserve other properties
    const currentTask = tasks?.find(task => task.id === taskId);
    if (!currentTask) return;

    // Determine the new status based on completion
    const newStatus = completed ? "DONE" : (currentTask.status === "DONE" ? "TODO" : currentTask.status);
    
    // Optimistic update - update UI immediately
    updateTaskInState(taskId, { 
      completed, 
      status: newStatus
    });
    
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        completed,
        status: newStatus
      }),
    });
    
    if (!response.ok) {
      // Revert optimistic update on error
      updateTaskInState(taskId, { 
        completed: currentTask.completed, 
        status: currentTask.status
      });
      throw new Error("Failed to update task");
    }
    
    // Get the actual response and update with server data
    const updatedTask = await response.json();
    updateTaskInState(taskId, {
      completed: updatedTask.completed,
      status: updatedTask.status,
      // Include any other fields that might have been updated by the server
      ...updatedTask
    });
    
  } catch (error) {
    console.error("Failed to update task:", error);
    // Optionally show a toast notification to the user
    // toast.error("Failed to update task. Please try again.");
  }
};

  const handleBulkAction = async (action: 'complete' | 'archive' | 'delete') => {
    // Implement bulk actions
    console.log(`Bulk ${action} for tasks:`, selectedTaskIds);
    setSelectedTaskIds([]);
  };

  const handleNewTaskCreated = () => {
    refetch();
    setIsNewTaskDialogOpen(false);
  };

  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedProjects([]);
    setDueDate(undefined);
    setSearchQuery("");
    setCurrentPage(1);
    updateFilters({
      status: undefined,
      projectId: undefined,
      dueDate: undefined,
      search: undefined
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-card rounded-lg border">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Loading your tasks</p>
            <p className="text-xs text-muted-foreground">This may take a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tasks) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <div className="mx-auto max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load tasks</h3>
          <p className="text-muted-foreground mb-6">
            We encountered an issue while loading your tasks. Please try again.
          </p>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Extract unique values for filters
  const uniqueStatuses = [...new Set(tasks.map((task) => task.status))];
  const uniqueProjects = tasks.map((task) => task.list.board)
    .filter((board, index, self) => 
      index === self.findIndex((b) => b.id === board.id)
    );

  // Enhanced filtering with search
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
      return false;
    }

    // Project filter
    if (selectedProjects.length > 0 && !selectedProjects.includes(task.list.board.id)) {
      return false;
    }

    return true;
  });

  // Enhanced pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Task statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed && t.status !== "archived" as any).length,
    overdue: tasks.filter(t => 
      !t.completed && 
      t.dueDate && 
      new Date(t.dueDate) < new Date()
    ).length
  };

  const hasActiveFilters = selectedStatuses.length > 0 || 
                          selectedProjects.length > 0 || 
                          dueDate || 
                          searchQuery;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
              <Badge variant="secondary" className="text-xs">
                {filteredTasks.length} of {tasks.length}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage and track your tasks across all projects
            </p>
          </div>

          {/* Task Statistics */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  {stats.completed}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Completed</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600" />
              <div className="text-sm">
                <div className="font-medium text-amber-900 dark:text-amber-100">
                  {stats.pending}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Pending</div>
              </div>
            </div>
            
            {stats.overdue > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm">
                  <div className="font-medium text-red-900 dark:text-red-100">
                    {stats.overdue}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Search and Actions Bar */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "gap-2",
                hasActiveFilters && "border-primary text-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 text-xs">
                  {selectedStatuses.length + selectedProjects.length + (dueDate ? 1 : 0) + (searchQuery ? 1 : 0)}
                </Badge>
              )}
            </Button>
            
            <Button 
              onClick={() => setIsNewTaskDialogOpen(true)} 
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <TasksTableFilters
              statuses={uniqueStatuses}
              assignees={[]}
              projects={uniqueProjects}
              selectedStatuses={selectedStatuses}
              selectedAssignees={[]}
              selectedProjects={selectedProjects}
              dueDate={dueDate}
              onStatusChange={handleStatusChange}
              onAssigneeChange={() => {}}
              onProjectChange={handleProjectChange}
              onDueDateChange={handleDueDateChange}
            />
            
            {hasActiveFilters && (
              <div className="mt-3 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {selectedTaskIds.length > 0 && (
          <div className="px-6 py-3 bg-primary/5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTaskIds.length === currentTasks.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTaskIds(currentTasks.map(t => t.id));
                  } else {
                    setSelectedTaskIds([]);
                  }
                }}
              />
              <span className="text-sm font-medium">
                {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('complete')}
              >
                Mark Complete
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('archive')}
              >
                Archive
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedTaskIds.length === currentTasks.length && currentTasks.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTaskIds(currentTasks.map(t => t.id));
                      } else {
                        setSelectedTaskIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="min-w-[250px] font-semibold">Task</TableHead>
                <TableHead className="min-w-[150px] hidden sm:table-cell font-semibold">Project</TableHead>
                <TableHead className="min-w-[120px] hidden md:table-cell font-semibold">Due Date</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                <TableHead className="w-[70px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      {hasActiveFilters ? (
                        <>
                          <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                          <h3 className="font-medium mb-1">No tasks match your filters</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Try adjusting your search criteria or clearing filters
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={clearAllFilters}
                          >
                            Clear filters
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium mb-1">No tasks yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create your first task to get started
                          </p>
                          <Button 
                            size="sm"
                            onClick={() => setIsNewTaskDialogOpen(true)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create Task
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className={cn(
                      "group hover:bg-muted/30 transition-colors",
                      task.completed && "bg-muted/20",
                      selectedTaskIds.includes(task.id) && "bg-primary/5"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTaskIds([...selectedTaskIds, task.id]);
                          } else {
                            setSelectedTaskIds(selectedTaskIds.filter(id => id !== task.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={cn(
                          "font-medium truncate",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </div>
                        
                        {/* Mobile info */}
                        <div className="sm:hidden space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {task.list.board.title}
                          </div>
                          {task.dueDate && (
                            <div className={cn(
                              "text-xs",
                              new Date(task.dueDate) < new Date() && !task.completed
                                ? "text-red-500 font-medium"
                                : "text-muted-foreground"
                            )}>
                              Due {formatDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {task.list.board.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate font-medium">
                          {task.list.board.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {task.dueDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span
                            className={cn(
                              "text-sm",
                              new Date(task.dueDate) < new Date() && !task.completed
                                ? "text-red-500 font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => 
                            handleCompleteTask(task.id, checked === true)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/${userId}/tasks/${task.id}`)}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/${userId}/tasks/${task.id}/edit`)}
                            >
                              Edit task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleCompleteTask(task.id, !task.completed)}
                            >
                              {task.completed ? 'Mark incomplete' : 'Mark complete'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Pagination */}
        {filteredTasks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing {indexOfFirstTask + 1}–{Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length}
              </span>
              <select
                value={tasksPerPage}
                onChange={(e) => {
                  setTasksPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-2 text-sm border rounded px-2 py-1 bg-background"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {/* Smart pagination numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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