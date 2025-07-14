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
import { CalendarIcon, Loader2, Plus, Edit3, Calendar as CalendarDays, Flag, X } from "lucide-react";
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

  // Helper function to safely parse dates
  const parseDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    
    try {
      let parsedDate: Date;
      
      if (typeof dateValue === 'string') {
        parsedDate = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        parsedDate = dateValue;
      } else {
        return undefined;
      }
      
      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        console.warn("Invalid date detected:", dateValue);
        return undefined;
      }
      
      return parsedDate;
    } catch (error) {
      console.error("Error parsing date:", error);
      return undefined;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTitle(card?.title || "");
      setDescription(card?.description || "");
      setDueDate(parseDate(card?.dueDate));
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
      handleClose();
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log("Date selected:", selectedDate);
    setDueDate(selectedDate);
    handleChange();
    // Close the popover after selection
    setIsDatePickerOpen(false);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Clearing date");
    setDueDate(undefined);
    handleChange();
  };

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-[580px] w-full max-w-[95vw] max-h-[95vh] mx-auto sm:mx-4 p-0",
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
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal",
                          "bg-background border-input text-foreground",
                          "hover:border-input/80 focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
                          !dueDate && "text-muted-foreground",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 bg-popover border-border shadow-lg" 
                      align="start"
                      side="bottom"
                      sideOffset={4}
                    >
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => {
                          // Disable dates before today
                          const dateToCheck = new Date(date);
                          dateToCheck.setHours(0, 0, 0, 0);
                          return dateToCheck < today;
                        }}
                        initialFocus
                        className="bg-popover text-popover-foreground rounded-lg border-0"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: cn(
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                          ),
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: cn(
                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                          ),
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
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