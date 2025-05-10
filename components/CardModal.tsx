"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Card {
  id: string;
  title: string;
  listId: string;
  order: number;
  description: string | null;
  dueDate: Date | null;
  completed?: boolean;
}

interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCard: Card) => void;
}

// Separate validation type and function for better organization
type ValidationErrors = {
  title?: string;
};

export const CardModal = ({ card, isOpen, onClose, onUpdate }: CardModalProps) => {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [completed, setCompleted] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title || "");
      setDescription(card.description || "");
      setCompleted(card.completed || false);
      
      // Format date for input if it exists
      if (card.dueDate) {
        const date = new Date(card.dueDate);
        setDueDate(date.toISOString().split('T')[0]);
      } else {
        setDueDate("");
      }
      
      // Reset states
      setErrors({});
      setSubmitStatus("idle");
    }
  }, [card]);

  // Focus on title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  // Validate the form
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitStatus("idle");
      
      const response = await fetch(`/api/card/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          completed
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update card");
      }
      
      const updatedCard = await response.json();
      
      setSubmitStatus("success");
      onUpdate(updatedCard);
      
      toast.success("Card updated successfully");
      
      // Short delay before closing to show success state
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error updating card:", error);
      setSubmitStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to update card");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle date formatting for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return dateString;
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="card-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="card-modal-title" className="text-lg font-medium">Edit Card</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              className={`w-full p-2 border rounded-md focus:ring-1 outline-none transition-colors ${
                errors.title 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Card title"
              disabled={isSubmitting}
              maxLength={100}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1.5 text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.title}
              </p>
            )}
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${
                title.length > 90 ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {title.length}/100
              </span>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px] resize-vertical"
              placeholder="Add a more detailed description..."
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={today}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                disabled={isSubmitting}
              />
            </div>
            {dueDate && (
              <p className="mt-1 text-sm text-gray-500">
                {formatDateForDisplay(dueDate)}
              </p>
            )}
          </div>
          
          <div className="flex items-center bg-gray-50 p-3 rounded-md">
            <input
              id="completed"
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <label htmlFor="completed" className="ml-2 block text-sm text-gray-700">
              Mark as completed
            </label>
            {dueDate && completed && (
              <span className="ml-auto text-green-600 text-sm flex items-center">
                <CheckCircle size={14} className="mr-1" />
                Completed
              </span>
            )}
          </div>
          
          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className={`py-2 px-6 rounded-md text-white font-medium flex items-center justify-center min-w-[100px] transition-colors ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : submitStatus === "success"
                    ? 'bg-green-600'
                    : submitStatus === "error"
                      ? 'bg-red-600'
                      : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : submitStatus === "error" ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Try Again
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};