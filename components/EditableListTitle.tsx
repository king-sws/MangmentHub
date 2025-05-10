"use client";

import { useState, useRef, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";

interface EditableListTitleProps {
  id: string;
  title: string;
  onUpdate: (id: string, newTitle: string) => Promise<void>;
}

export function EditableListTitle({ id, title, onUpdate }: EditableListTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      setValue(title); // Reset to original value
    } else if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (value.trim() === "") {
      setValue(title); // Reset to original value if empty
      setIsEditing(false);
      return;
    }

    if (value !== title) {
      setIsLoading(true);
      try {
        await onUpdate(id, value);
        toast.success("List title updated");
      } catch (error) {
        console.error("Failed to update list title:", error);
        toast.error("Failed to update list title");
        setValue(title); // Reset to original on error
      } finally {
        setIsLoading(false);
      }
    }
    
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isLoading}
        className="bg-gray-100 text-gray-800 font-medium text-sm px-1 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full max-w-[160px]"
      />
    );
  }

  return (
    <div 
      className="flex items-center group cursor-grab"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-gray-800 font-medium text-sm truncate max-w-[160px]">
        {title}
      </span>
      <button
        onClick={handleEdit}
        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-blue-500"
      >
        <Edit2 size={12} />
        <span className="sr-only">Edit list title</span>
      </button>
    </div>
  );
}