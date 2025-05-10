/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
}

export function CardDialog({
  isOpen,
  onClose,
  onSave,
  card,
  isCreating,
  isLoading
}: CardDialogProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [dueDate, setDueDate] = useState<Date | null>(card?.dueDate || null);
  const [status, setStatus] = useState<CardStatus>(card?.status || CardStatus.TODO);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(card?.title || "");
      setDescription(card?.description || "");
      setDueDate(card?.dueDate || null);
      setStatus(card?.status || CardStatus.TODO);
      setIsDirty(false);
    }
  }, [isOpen, card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    onSave({
      title,
      description: description || null,
      dueDate,
      status
    });
  };

  const handleChange = () => {
    setIsDirty(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create New Card" : "Edit Card"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleChange();
                }}
                placeholder="Enter card title"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  handleChange();
                }}
                placeholder="Enter card description"
                disabled={isLoading}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value: CardStatus) => {
                  setStatus(value);
                  handleChange();
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CardStatus.BACKLOG}>Backlog</SelectItem>
                  <SelectItem value={CardStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={CardStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={CardStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={CardStatus.DONE}>Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate || undefined}
                    onSelect={(date) => {
                      setDueDate(date || null);
                      handleChange();
                    }}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-2 border-t flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setDueDate(null);
                          handleChange();
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!isDirty && !isCreating)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreating ? "Creating..." : "Saving..."}
                </>
              ) : (
                <>{isCreating ? "Create Card" : "Save Changes"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
