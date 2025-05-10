"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, FilterIcon } from "lucide-react";
import { format } from "date-fns";
import { Board, User } from "@prisma/client";

interface TasksTableFiltersProps {
  statuses: string[];
  assignees: User[];
  projects: Board[];
  selectedStatuses: string[];
  selectedAssignees: string[];
  selectedProjects: string[];
  dueDate: Date | undefined;
  onStatusChange: (statuses: string[]) => void;
  onAssigneeChange: (assignees: string[]) => void;
  onProjectChange: (projects: string[]) => void;
  onDueDateChange: (date: Date | undefined) => void;
}

export function TasksTableFilters({
  statuses,
  assignees,
  projects,
  selectedStatuses,
  selectedAssignees,
  selectedProjects,
  dueDate,
  onStatusChange,
  onAssigneeChange,
  onProjectChange,
  onDueDateChange,
}: TasksTableFiltersProps) {
  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const toggleAssignee = (assigneeId: string) => {
    if (selectedAssignees.includes(assigneeId)) {
      onAssigneeChange(selectedAssignees.filter((id) => id !== assigneeId));
    } else {
      onAssigneeChange([...selectedAssignees, assigneeId]);
    }
  };

  const toggleProject = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      onProjectChange(selectedProjects.filter((id) => id !== projectId));
    } else {
      onProjectChange([...selectedProjects, projectId]);
    }
  };

  return (
    <div className="flex space-x-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 flex items-center gap-2">
            <FilterIcon className="h-3.5 w-3.5" />
            All statuses
            {selectedStatuses.length > 0 && (
              <span className="ml-1 rounded-full bg-primary w-4 h-4 text-[10px] flex items-center justify-center text-primary-foreground">
                {selectedStatuses.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {statuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={selectedStatuses.includes(status)}
              onCheckedChange={() => toggleStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace("_", " ")}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 flex items-center gap-2">
            <FilterIcon className="h-3.5 w-3.5" />
            All assignees
            {selectedAssignees.length > 0 && (
              <span className="ml-1 rounded-full bg-primary w-4 h-4 text-[10px] flex items-center justify-center text-primary-foreground">
                {selectedAssignees.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {assignees.map((assignee) => (
            <DropdownMenuCheckboxItem
              key={assignee.id}
              checked={selectedAssignees.includes(assignee.id)}
              onCheckedChange={() => toggleAssignee(assignee.id)}
            >
              {assignee.name || assignee.email}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 flex items-center gap-2">
            <FilterIcon className="h-3.5 w-3.5" />
            All projects
            {selectedProjects.length > 0 && (
              <span className="ml-1 rounded-full bg-primary w-4 h-4 text-[10px] flex items-center justify-center text-primary-foreground">
                {selectedProjects.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {projects.map((project) => (
            <DropdownMenuCheckboxItem
              key={project.id}
              checked={selectedProjects.includes(project.id)}
              onCheckedChange={() => toggleProject(project.id)}
            >
              {project.title}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm" 
            className={cn(
              "h-8 flex items-center gap-2",
              !dueDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {dueDate ? format(dueDate, "PPP") : "Due date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={onDueDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {(selectedStatuses.length > 0 || selectedAssignees.length > 0 || 
        selectedProjects.length > 0 || dueDate) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8"
          onClick={() => {
            onStatusChange([]);
            onAssigneeChange([]);
            onProjectChange([]);
            onDueDateChange(undefined);
          }}
        >
          Reset filters
        </Button>
      )}
    </div>
  );
}