"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Card {
  id: string;
  title: string;
  listId: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date | null;
  description: string | null;
  dueDate: Date | null;
  completed?: boolean;
}

interface CardFormProps {
  listId: string;
  onCardCreated?: (card: Card) => void;
}

export const CardForm = ({ listId, onCardCreated }: CardFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          listId
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create card");
      }
      
      // Parse the response to get the new card data
      const newCard = await response.json();
      
      // Call the callback with the new card data
      if (onCardCreated && newCard) {
        onCardCreated(newCard);
      }
      
      toast.success("Card created successfully");
      setTitle("");
      setDescription("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error creating card:", error);
      toast.error("Failed to create card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const enableEditing = () => {
    setIsEditing(true);
  };

  const disableEditing = () => {
    setIsEditing(false);
    setTitle("");
    setDescription("");
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter card title..."
          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
          disabled={isSubmitting}
          autoFocus
        />
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description (optional)"
          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm resize-none h-20"
          disabled={isSubmitting}
        />
        
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className={`px-3 py-1.5 text-sm font-medium rounded-md text-white ${
              isSubmitting || !title.trim()
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Adding...
              </div>
            ) : (
              "Add Card"
            )}
          </button>
          
          <button
            type="button"
            onClick={disableEditing}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={enableEditing}
      className="flex items-center w-full p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
    >
      <Plus size={16} className="mr-1" />
      <span>Add a card</span>
    </button>
  );
};