/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  isLoading: boolean;
  initialTitle?: string;
  isDarkMode?: boolean;
}

export function ListDialog({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialTitle = "",
  isDarkMode = false
}: ListDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
    }
  }, [isOpen, initialTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          // Mobile-first responsive sizing
          "w-[95vw] max-w-[400px] sm:max-w-md",
          "min-h-0 max-h-[90vh] overflow-hidden",
          "mx-auto p-0",
          "bg-card text-card-foreground border shadow-xl rounded-xl",
          "focus:outline-none",
          // Better mobile positioning
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        onKeyDown={handleKeyDown}
      >
        <div className="relative flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border/50 bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base sm:text-lg font-semibold leading-tight text-foreground">
                    Create List
                  </DialogTitle>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-muted-foreground leading-tight">
                    Create a new list to organize your tasks
                  </p>
                </div>
              </div>
              
              {/* Mobile close button */}
              
            </div>
          </div>

          {/* Form */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 flex-1 overflow-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="title" 
                  className="text-sm font-medium text-foreground"
                >
                  List name <span className="text-destructive">*</span>
                </Label>
                
                <div className="relative">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="e.g., My Tasks, Shopping List"
                    disabled={isLoading}
                    required
                    autoFocus
                    className={cn(
                      "h-12 sm:h-10 px-3 text-base sm:text-sm rounded-lg border transition-all duration-200",
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
                
                {/* Helper text - shorter on mobile */}
                <p className="text-xs text-muted-foreground">
                  <span className="sm:hidden">Give your list a descriptive name</span>
                  <span className="hidden sm:inline">Give your list a descriptive name to help you stay organized</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={handleClose} 
                  disabled={isLoading}
                  type="button"
                  className={cn(
                    "w-full sm:w-auto px-4 py-2.5 sm:py-2 h-12 sm:h-9 text-base sm:text-sm font-medium rounded-lg transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    isLoading && "opacity-50 cursor-not-allowed",
                    "hidden sm:flex" // Hide on mobile since we have X button
                  )}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit"
                  disabled={isLoading || !title.trim()}
                  className={cn(
                    "w-full sm:w-auto px-4 py-2.5 sm:py-2 h-12 sm:h-9 text-base sm:text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px]",
                    "flex items-center justify-center gap-2",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "shadow-sm hover:shadow-md active:scale-[0.98] sm:active:scale-100"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create List</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}