"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CardStatus } from "@prisma/client";

import { useWorkspaceMembers } from "@/hooks/WorkspaceMember";
import { useBoards } from "./useBoards";
import { useLists } from "./useLists";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTaskDialog({ open, onOpenChange }: NewTaskDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<CardStatus>("TODO");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const { data: boards } = useBoards();
  const { data: lists } = useLists(selectedBoardId);
  const { data: members } = useWorkspaceMembers(
    boards?.find((board) => board.id === selectedBoardId)?.workspaceId
  );

  // Reset form when dialog opens or closes
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setStatus("TODO");
    setSelectedBoardId("");
    setSelectedListId("");
    setSelectedAssigneeIds([]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedListId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          listId: selectedListId,
          dueDate: dueDate?.toISOString(),
          status,
          assigneeIds: selectedAssigneeIds,
        }),
      });

      if (response.ok) {
        handleOpenChange(false);
        router.refresh();
      } else {
        console.error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "BACKLOG", label: "Backlog" },
    { value: "TODO", label: "Todo" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "DONE", label: "Done" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="board" className="text-sm font-medium">
                  Project
                </label>
                <Select
                  value={selectedBoardId}
                  onValueChange={(value) => {
                    setSelectedBoardId(value);
                    setSelectedListId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards?.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="list" className="text-sm font-medium">
                  List
                </label>
                <Select
                  value={selectedListId}
                  onValueChange={setSelectedListId}
                  disabled={!selectedBoardId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select list" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists?.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <Select value={status} onValueChange={(value) => setStatus(value as CardStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="assignee" className="text-sm font-medium">
                Assignee
              </label>
              <Select
                value={selectedAssigneeIds[0] || ""}
                onValueChange={(value) => setSelectedAssigneeIds(value ? [value] : [])}
                disabled={!selectedBoardId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user.name || member.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !selectedListId}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}