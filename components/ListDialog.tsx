/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, List } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`
          sm:max-w-md w-full mx-4 p-0 border-0 shadow-xl rounded-xl overflow-hidden
          ${isDarkMode 
            ? "bg-slate-800 shadow-slate-900/25" 
            : "bg-white shadow-slate-200/50"
          }
        `}
        onKeyDown={handleKeyDown}
      >
        <div className="relative">
          {/* Compact Header */}
          <div className={`
            px-5 py-4 border-b flex items-center justify-between
            ${isDarkMode ? "border-slate-700/50" : "border-slate-200/50"}
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                ${isDarkMode ? "bg-slate-700/50" : "bg-slate-100"}
              `}>
                <List className={`w-4 h-4 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`} />
              </div>
              <div>
                <DialogTitle className={`
                  text-lg font-semibold leading-none
                  ${isDarkMode ? "text-slate-100" : "text-slate-900"}
                `}>
                  Create List
                </DialogTitle>
              </div>
            </div>
            
            
          </div>

          {/* Compact Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4">
            <div className="space-y-3">
              <Label 
                htmlFor="title" 
                className={`
                  text-sm font-medium
                  ${isDarkMode ? "text-slate-300" : "text-slate-700"}
                `}
              >
                List name
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
                  className={`
                    h-10 px-3 text-sm rounded-lg border transition-all duration-200 w-full
                    ${isDarkMode 
                      ? "bg-slate-700/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400" 
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    }
                    ${isFocused 
                      ? isDarkMode
                        ? "border-blue-500/50 ring-2 ring-blue-500/20 bg-slate-700/80" 
                        : "border-blue-500/50 ring-2 ring-blue-500/20"
                      : isDarkMode
                        ? "hover:border-slate-500/50 hover:bg-slate-700/80"
                        : "hover:border-slate-400"
                    }
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                    focus:outline-none
                  `}
                />
                
                {/* Success indicator */}
                {title.trim() && !isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                disabled={isLoading}
                type="button"
                className={`
                  px-4 py-2 h-9 text-sm font-medium rounded-lg transition-all duration-200
                  ${isDarkMode 
                    ? "text-slate-300 hover:text-slate-100 hover:bg-slate-700/50" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit"
                disabled={isLoading || !title.trim()}
                className={`
                  px-4 py-2 h-9 text-sm font-medium rounded-lg transition-all duration-200 min-w-[90px]
                  flex items-center justify-center gap-2
                  ${isDarkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600/50 hover:border-slate-500/50"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-sm hover:shadow-md
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
