/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Edit3, Calendar as CalendarDays, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Card {
  id: string;
  title: string;
  listId: string;
  order: number;
  description: string | null;
  dueDate: Date | null;
  completed: boolean;
  status: CardStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignees?: any[];
  createdAt: Date;
  updatedAt: Date | null;
}

interface CardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Card>) => void;
  card: Card | null;
  isCreating: boolean;
  isLoading: boolean;
  isDarkMode?: boolean;
}

const statusConfig = {
  [CardStatus.BACKLOG]: { label: "Backlog", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
  [CardStatus.TODO]: { label: "To Do", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  [CardStatus.IN_PROGRESS]: { label: "In Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  [CardStatus.IN_REVIEW]: { label: "In Review", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  [CardStatus.DONE]: { label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
};

const priorityConfig = {
  'LOW': { 
    label: "Low", 
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-800/50",
    borderColor: "border-slate-200 dark:border-slate-700",
  },
  'MEDIUM': { 
    label: "Medium", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  'HIGH': { 
    label: "High", 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  'URGENT': { 
    label: "Urgent", 
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
  }
};

export function CardDialog({
  isOpen,
  onClose,
  onSave,
  card,
  isCreating,
  isLoading,
  isDarkMode = false
}: CardDialogProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<CardStatus>(card?.status || CardStatus.TODO);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | undefined>(card?.priority);
  const [isDirty, setIsDirty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(card?.title || "");
      setDescription(card?.description || "");
      
      // Fix date handling - properly handle Date objects and strings
      let initialDate: Date | undefined = undefined;
      if (card?.dueDate) {
        try {
          // Handle both string and Date types
          if (typeof card.dueDate === 'string') {
            initialDate = new Date(card.dueDate);
          } else if (card.dueDate instanceof Date) {
            initialDate = card.dueDate;
          }
          
          // Validate the date
          if (initialDate && isNaN(initialDate.getTime())) {
            console.warn("Invalid date detected, setting to undefined");
            initialDate = undefined;
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          initialDate = undefined;
        }
      }
      setDueDate(initialDate);
      
      setStatus(card?.status || CardStatus.TODO);
      setPriority(card?.priority);
      setIsDirty(false);
      setIsDatePickerOpen(false);
    }
  }, [isOpen, card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate || null,
      status,
      priority
    });
  };

  const handleChange = () => setIsDirty(true);

  const handleClose = () => {
    if (!isLoading) {
      setIsDatePickerOpen(false);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isDatePickerOpen) {
      onClose();
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log("Date selected:", selectedDate);
    setDueDate(selectedDate);
    handleChange();
    // Close the popover after selection
    setIsDatePickerOpen(false);
  };

  const handleClearDate = () => {
    console.log("Clearing date");
    setDueDate(undefined);
    handleChange();
    setIsDatePickerOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-[580px] w-full max-w-[95vw] max-h-[95vh] mx-auto  sm:mx-4 p-0",
          "bg-card text-card-foreground border shadow-xl rounded-xl overflow-hidden",
          "focus:outline-none"
        )}
        onKeyDown={handleKeyDown}
      >
        <div className="relative flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                {isCreating ? (
                  <Plus className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold leading-none text-foreground">
                  {isCreating ? "New Task" : "Edit Task"}
                </DialogTitle>
                <p className="text-sm mt-1 text-muted-foreground">
                  {isCreating ? "Create a new task item" : "Modify task details"}
                </p>
              </div>
            </div>
          </div>

          {/* Form - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label 
                  htmlFor="title" 
                  className="text-sm font-medium text-foreground"
                >
                  Title <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      handleChange();
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Task title"
                    disabled={isLoading}
                    required
                    autoFocus
                    className={cn(
                      "h-10 px-3 text-sm rounded-lg border transition-all duration-200",
                      "bg-background border-input text-foreground placeholder:text-muted-foreground",
                      "hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  
                  {/* Success indicator */}
                  {title.trim() && !isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Responsive layout for Status, Priority, and Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Status
                  </Label>
                  <Select 
                    value={status} 
                    onValueChange={(value: CardStatus) => {
                      setStatus(value);
                      handleChange();
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={cn(
                      "h-10 rounded-lg border transition-all duration-200",
                      "bg-background border-input text-foreground",
                      "hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem 
                          key={key} 
                          value={key} 
                          className="hover:bg-accent hover:text-accent-foreground text-popover-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[0]} ${config.color.split(' ')[2]}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Priority
                  </Label>
                  <Select 
                    value={priority || "NONE"} 
                    onValueChange={(value: string) => {
                      setPriority(value === "NONE" ? undefined : value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT');
                      handleChange();
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={cn(
                      "h-10 rounded-lg border transition-all duration-200",
                      "bg-background border-input text-foreground",
                      "hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none"
                    )}>
                      <SelectValue placeholder="No priority">
                        {priority && (
                          <div className="flex items-center gap-2">
                            <Flag size={12} className={priorityConfig[priority].color} />
                            {priorityConfig[priority].label}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem 
                        value="NONE" 
                        className="hover:bg-accent hover:text-accent-foreground text-popover-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                          No priority
                        </div>
                      </SelectItem>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem 
                          key={key} 
                          value={key} 
                          className="hover:bg-accent hover:text-accent-foreground text-popover-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Flag size={12} className={config.color} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Due Date
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const selectedDate = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
                        handleDateSelect(selectedDate);
                      }}
                      min={format(new Date(), "yyyy-MM-dd")}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 h-10 px-3 text-sm rounded-lg border transition-all duration-200",
                        "bg-background border-input text-foreground",
                        "hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
                        isLoading && "opacity-50 cursor-not-allowed",
                        "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                        "dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert"
                      )}
                    />
                    {dueDate && (
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleClearDate}
                        disabled={isLoading}
                        className={cn(
                          "h-10 px-3 rounded-lg border transition-all duration-200",
                          "bg-background border-input text-muted-foreground hover:text-foreground",
                          "hover:bg-accent hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                        title="Clear date"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label 
                  htmlFor="description" 
                  className="text-sm font-medium text-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    handleChange();
                  }}
                  placeholder="Add task description..."
                  disabled={isLoading}
                  rows={3}
                  className={cn(
                    "resize-none rounded-lg border transition-all duration-200",
                    "bg-background border-input text-foreground placeholder:text-muted-foreground",
                    "hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none"
                  )}
                />
              </div>
            </form>
          </div>

          {/* Footer - Fixed */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border/50 bg-card">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <Button 
                variant="ghost" 
                onClick={handleClose} 
                disabled={isLoading}
                type="button"
                className={cn(
                  "w-full sm:w-auto px-4 py-2 h-9 text-sm font-medium rounded-lg transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading || !title.trim() || (!isDirty && !isCreating)}
                onClick={handleSubmit}
                className={cn(
                  "w-full sm:w-auto px-4 py-2 h-9 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px]",
                  "flex items-center justify-center gap-2",
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-sm hover:shadow-md"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">{isCreating ? "Creating..." : "Saving..."}</span>
                    <span className="sm:hidden">{isCreating ? "Creating" : "Saving"}</span>
                  </>
                ) : (
                  <>
                    {isCreating ? (
                      <Plus className="w-4 h-4" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                    <span>{isCreating ? "Create" : "Save"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}