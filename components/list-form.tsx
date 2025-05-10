/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface List {
  id: string;
  title: string;
  cards: any[];
  createdAt?: Date;
  updatedAt?: Date | null;
  order?: number;
}

interface ListFormProps {
  boardId: string;
  onListCreated?: (list: List) => void;
}

export function ListForm({ boardId, onListCreated }: ListFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          boardId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create list");
      }
      
      // Parse the response to get the new list data
      const newList = await response.json();
      
      // Call the callback with the new list data
      if (onListCreated && newList) {
        // Initialize with empty cards array if not provided
        if (!newList.cards) {
          newList.cards = [];
        }
        onListCreated(newList);
      }
      
      toast.success("List created successfully");
      setTitle("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, boardId, onListCreated]);

  const enableEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const disableEditing = useCallback(() => {
    setIsEditing(false);
    setTitle("");
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Enter, cancel on Escape
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) form.requestSubmit();
    } else if (e.key === "Escape") {
      disableEditing();
    }
  }, [disableEditing]);

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="w-full p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter list title..."
          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          disabled={isSubmitting}
          autoFocus
        />
        
        <div className="flex items-center gap-2 mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className={`px-3 py-2 font-medium rounded-md text-white transition-colors ${
              isSubmitting || !title.trim()
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Creating...
              </div>
            ) : (
              "Add List"
            )}
          </button>
          
          <button
            type="button"
            onClick={disableEditing}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={enableEditing}
      className="flex items-center justify-center w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
    >
      <Plus size={20} className="mr-1" />
      <span className="font-medium">Add new list</span>
    </button>
  );
}