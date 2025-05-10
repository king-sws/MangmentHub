"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Check, Clock, Pencil, Tag, Trash2, User } from "lucide-react";
import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

interface Card {
  id: string;
  title: string;
  listId: string;
  order: number;
  description: string | null;
  dueDate: Date | null;
  completed?: boolean;
  status?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  assignees?: User[];
  createdAt?: Date;
  updatedAt?: Date | null;
}

interface SortableCardProps {
  id: string;
  title: string;
  listId: string;
  onDelete: () => void;
  onEdit?: () => void;
  onToggleComplete?: () => void;
  card: Card;
}

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString();
}

function getDueDateStatus(card: Card) {
  if (!card.dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(card.dueDate);
  due.setHours(0, 0, 0, 0);

  const diff = due.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (card.completed) return "completed";
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 2) return "soon";
  return "future";
}

function getDueDateClasses(status: string | null) {
  switch (status) {
    case "overdue": return "text-red-600 font-medium";
    case "today": return "text-orange-500 font-medium";
    case "soon": return "text-yellow-600";
    case "completed": return "text-green-600";
    default: return "text-gray-500";
  }
}

function getStatusBadgeColor(status: string | undefined) {
  switch (status) {
    case "BACKLOG": return "bg-gray-200 text-gray-800";
    case "TODO": return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
    case "IN_REVIEW": return "bg-purple-100 text-purple-800";
    case "DONE": return "bg-green-100 text-green-800";
    default: return "bg-gray-200 text-gray-800";
  }
}

const SortableCard = memo(function SortableCard({
  id,
  title,
  listId,
  onDelete,
  onEdit,
  onToggleComplete,
  card
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "card", listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dueStatus = getDueDateStatus(card);
  const dueClasses = getDueDateClasses(dueStatus);
  const statusBadgeColor = getStatusBadgeColor(card.status);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && onEdit) {
      onEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`
        p-3 bg-white rounded-md shadow-sm border mb-2 cursor-pointer 
        hover:shadow-md transition-all duration-200 group
        ${isDragging ? "opacity-50 scale-105" : ""}
        ${
          card.completed
            ? "border-l-4 border-l-green-500 border-gray-100"
            : dueStatus === "overdue"
            ? "border-l-4 border-l-red-500 border-gray-100"
            : "border-gray-200"
        }
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          {/* Title with completion status */}
          <div className="flex items-center">
            {onToggleComplete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete();
                }}
                className={`w-4 h-4 mr-2 rounded border flex items-center justify-center
                  ${card.completed 
                    ? "bg-green-500 border-green-500 text-white" 
                    : "border-gray-300 hover:border-gray-400"}`}
              >
                {card.completed && <Check size={12} />}
              </button>
            )}
            <p className={`text-sm font-medium ${card.completed ? "text-gray-500 line-through" : "text-gray-700"}`}>
              {title}
            </p>
          </div>

          {/* Card description preview */}
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Status badge */}
          {card.status && (
            <div className="mt-2">
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${statusBadgeColor}`}>
                <Tag size={10} className="mr-1" />
                {card.status.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Due date */}
          {card.dueDate && (
            <div className={`flex items-center mt-2 text-xs ${dueClasses}`}>
              <Calendar size={12} className="mr-1" />
              <span>{formatDate(card.dueDate)}</span>
            </div>
          )}

          {/* Card metadata - modification time */}
          {card.updatedAt && (
            <div className="flex items-center mt-2 text-xs text-gray-400">
              <Clock size={10} className="mr-1" />
              <span>Updated {new Date(card.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-xs text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-gray-100"
              aria-label="Edit card"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-gray-100"
            aria-label="Delete card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Assignees section */}
      {card.assignees && card.assignees.length > 0 && (
        <div className="mt-3 flex items-center">
          <div className="flex -space-x-2 overflow-hidden">
            {card.assignees.slice(0, 3).map((user) => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-white">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name || user.email} />
                      ) : (
                        <AvatarFallback>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name || user.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {card.assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export { SortableCard };