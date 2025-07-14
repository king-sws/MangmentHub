/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Calendar, 
  Check, 
  Clock, 
  Pencil, 
  Tag, 
  Trash2,
  User,
  MoreHorizontal,
  Flag,
  MessageSquare,
  Paperclip,
  AlertCircle,
  TrendingUp,
  Eye,
  Star,
  Copy,
  Archive,
  ExternalLink
} from "lucide-react";
import { memo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  commentsCount?: number;
  attachmentsCount?: number;
  labels?: Array<{ id: string; name: string; color: string; }>;
  progress?: number; // 0-100
  estimatedHours?: number;
  actualHours?: number;
  isStarred?: boolean;
  viewCount?: number;
}

interface SortableCardProps {
  id: string;
  title: string;
  listId: string;
  onDelete: () => void;
  onEdit?: () => void;
  onToggleComplete?: () => void;
  onStar?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  card: Card;
  theme?: 'light' | 'dark';
}

function formatDate(date: Date | null) {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Due Today';
  if (diffDays === 1) return 'Due Tomorrow';
  if (diffDays === -1) return 'Due Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `Due in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `Overdue by ${Math.abs(diffDays)} days`;
  
  return target.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: now.getFullYear() !== target.getFullYear() ? 'numeric' : undefined
  });
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

function getPriorityConfig(priority: string | undefined) {
  if (!priority) return null;
  
  const configs = {
    'LOW': { 
      color: 'text-slate-500 dark:text-slate-400', 
      bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
      borderColor: 'border-slate-200 dark:border-slate-700',
      label: 'Low Priority'
    },
    'MEDIUM': { 
      color: 'text-blue-600 dark:text-blue-400', 
      bgColor: 'bg-blue-50 dark:bg-blue-900/20', 
      borderColor: 'border-blue-200 dark:border-blue-800',
      label: 'Medium Priority'
    },
    'HIGH': { 
      color: 'text-amber-600 dark:text-amber-400', 
      bgColor: 'bg-amber-50 dark:bg-amber-900/20', 
      borderColor: 'border-amber-200 dark:border-amber-800',
      label: 'High Priority'
    },
    'URGENT': { 
      color: 'text-red-600 dark:text-red-400', 
      bgColor: 'bg-red-50 dark:bg-red-900/20', 
      borderColor: 'border-red-200 dark:border-red-800',
      label: 'Urgent Priority'
    }
  };
  
  return configs[priority as keyof typeof configs];
}

function getStatusConfig(status: string | undefined) {
  if (!status) return null;
  
  const configs = {
    'BACKLOG': { 
      color: 'text-slate-600 dark:text-slate-300', 
      bgColor: 'bg-slate-100 dark:bg-slate-700/50', 
      borderColor: 'border-slate-300 dark:border-slate-600',
      icon: '📋'
    },
    'TODO': { 
      color: 'text-blue-700 dark:text-blue-300', 
      bgColor: 'bg-blue-50 dark:bg-blue-900/30', 
      borderColor: 'border-blue-200 dark:border-blue-700',
      icon: '📝'
    },
    'IN_PROGRESS': { 
      color: 'text-amber-700 dark:text-amber-300', 
      bgColor: 'bg-amber-50 dark:bg-amber-900/30', 
      borderColor: 'border-amber-200 dark:border-amber-700',
      icon: '⚡'
    },
    'IN_REVIEW': { 
      color: 'text-purple-700 dark:text-purple-300', 
      bgColor: 'bg-purple-50 dark:bg-purple-900/30', 
      borderColor: 'border-purple-200 dark:border-purple-700',
      icon: '👀'
    },
    'DONE': { 
      color: 'text-emerald-700 dark:text-emerald-300', 
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', 
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      icon: '✅'
    }
  };
  
  return configs[status as keyof typeof configs];
}

const SortableCard = memo(function SortableCard({
  id,
  title,
  listId,
  onDelete,
  onEdit,
  onToggleComplete,
  onStar,
  onDuplicate,
  onArchive,
  card,
  theme = 'light'
}: SortableCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const isDark = theme === 'dark';
  const dueStatus = getDueDateStatus(card);
  const priorityConfig = getPriorityConfig(card.priority);
  const statusConfig = getStatusConfig(card.status);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && !target.closest('[role="menuitem"]') && onEdit) {
      onEdit();
    }
  };

  // Card styling based on priority and status
  const getCardClasses = () => {
    let baseClasses = `
      relative group cursor-pointer rounded-xl border transition-all duration-200 
      bg-white dark:bg-zinc-900/20
      border-slate-200 dark:border-slate-700 
      hover:border-slate-300 dark:hover:border-slate-600
      hover:shadow-lg dark:hover:shadow-slate-900/50
      shadow-sm hover:shadow-md
    `;
    
    if (card.completed) {
      baseClasses += ' opacity-75 bg-slate-50 dark:bg-slate-800/50';
    }
    
    // Priority left border accent
    if (card.priority === 'URGENT' && !card.completed) {
      baseClasses += ' border-l-4 border-l-red-500 dark:border-l-red-400';
    } else if (card.priority === 'HIGH' && !card.completed) {
      baseClasses += ' border-l-4 border-l-amber-500 dark:border-l-amber-400';
    } else if (dueStatus === 'overdue' && !card.completed) {
      baseClasses += ' border-l-4 border-l-red-600 dark:border-l-red-400 bg-red-50/30 dark:bg-red-900/10';
    }
    
    if (isDragging) {
      baseClasses += ' shadow-2xl scale-[1.02] rotate-1 ring-2 ring-blue-500/20';
    }
    
    return baseClasses;
  };

  const getDueDateClasses = () => {
    const baseClasses = "inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md border";
    
    switch (dueStatus) {
      case "overdue": 
        return `${baseClasses} text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800`;
      case "today": 
        return `${baseClasses} text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800`;
      case "soon": 
        return `${baseClasses} text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800`;
      case "completed": 
        return `${baseClasses} text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800`;
      default: 
        return `${baseClasses} text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700`;
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={`p-5 mb-3 ${getCardClasses()}`}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Completion Checkbox */}
            {onToggleComplete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete();
                }}
                className={`
                  mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center
                  transition-all duration-200 hover:scale-110 flex-shrink-0
                  ${card.completed 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }
                `}
              >
                {card.completed && <Check size={12} strokeWidth={2.5} />}
              </button>
            )}

            <div className="flex-1 min-w-0">
              {/* Title and Priority */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-2 flex-1 min-w-0">
                  {priorityConfig && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-0.5 flex-shrink-0">
                          <Flag size={14} className={priorityConfig.color} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{priorityConfig.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <h3 className={`
                    font-semibold text-base leading-tight flex-1 min-w-0
                    ${card.completed 
                      ? 'text-slate-500 dark:text-slate-400 line-through' 
                      : 'text-slate-900 dark:text-slate-100'
                    }
                  `}>
                    {title}
                  </h3>
                </div>
                
                {/* Star Button */}
                {onStar && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStar();
                    }}
                    className={`
                      ml-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-110
                      ${card.isStarred 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-slate-400 dark:text-slate-500 hover:text-yellow-500'
                      }
                    `}
                  >
                    <Star size={16} fill={card.isStarred ? "currentColor" : "none"} />
                  </button>
                )}
              </div>

              {/* Description */}
              {card.description && (
                <p className={`
                  text-sm leading-relaxed mb-3 line-clamp-2
                  ${card.completed 
                    ? 'text-slate-400 dark:text-slate-500' 
                    : 'text-slate-600 dark:text-slate-300'
                  }
                `}>
                  {card.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()}
                className={`
                  ml-2 p-2 rounded-lg transition-all duration-200 
                  opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800
                  text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
                  ${isMenuOpen ? 'opacity-100' : ''}
                `}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Pencil size={16} />
                  <span>Edit Card</span>
                </DropdownMenuItem>
              )}
              
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Copy size={16} />
                  <span>Duplicate</span>
                </DropdownMenuItem>
              )}
              
              {onArchive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Archive size={16} />
                  <span>Archive</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        {card.progress !== undefined && card.progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progress</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{card.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${card.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {card.labels.slice(0, 4).map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md border"
                style={{
                  backgroundColor: isDark ? `${label.color}15` : `${label.color}10`,
                  borderColor: isDark ? `${label.color}40` : `${label.color}30`,
                  color: label.color
                }}
              >
                {label.name}
              </span>
            ))}
            {card.labels.length > 4 && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                +{card.labels.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Status and Due Date Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusConfig && (
            <span className={`
              inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md border
              ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}
            `}>
              <span className="mr-1.5">{statusConfig.icon}</span>
              {card.status?.replace(/_/g, ' ')}
            </span>
          )}

          {card.dueDate && (
            <span className={getDueDateClasses()}>
              <Calendar size={12} className="mr-1.5" />
              {formatDate(card.dueDate)}
              {dueStatus === 'overdue' && <AlertCircle size={12} className="ml-1" />}
            </span>
          )}
        </div>

        {/* Time Tracking */}
        {(card.estimatedHours || card.actualHours) && (
          <div className="flex items-center space-x-4 mb-4 text-xs text-slate-600 dark:text-slate-400">
            {card.estimatedHours && (
              <div className="flex items-center">
                <Clock size={12} className="mr-1" />
                <span>Est: {card.estimatedHours}h</span>
              </div>
            )}
            {card.actualHours && (
              <div className="flex items-center">
                <TrendingUp size={12} className="mr-1" />
                <span>Logged: {card.actualHours}h</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Assignees */}
          <div className="flex items-center">
            {card.assignees && card.assignees.length > 0 ? (
              <div className="flex -space-x-1.5">
                {card.assignees.slice(0, 3).map((user) => (
                  <Tooltip key={`${card.id}-${user.id}`}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform duration-200 shadow-sm">
                        {user.image ? (
                          <AvatarImage src={user.image} alt={user.name || user.email} />
                        ) : (
                          <AvatarFallback className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{user.name || user.email}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {card.assignees.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform duration-200 shadow-sm">
                        +{card.assignees.length - 3}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{card.assignees.length - 3} more assignees</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ) : (
              <div className="h-7 w-7 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <User size={12} />
              </div>
            )}
          </div>

          {/* Engagement Metrics */}
          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            {card.viewCount && card.viewCount > 0 && (
              <div className="flex items-center">
                <Eye size={12} className="mr-1" />
                <span>{card.viewCount}</span>
              </div>
            )}
            
            {card.commentsCount && card.commentsCount > 0 && (
              <div className="flex items-center">
                <MessageSquare size={12} className="mr-1" />
                <span>{card.commentsCount}</span>
              </div>
            )}
            
            {card.attachmentsCount && card.attachmentsCount > 0 && (
              <div className="flex items-center">
                <Paperclip size={12} className="mr-1" />
                <span>{card.attachmentsCount}</span>
              </div>
            )}

            {card.updatedAt && (
              <div className="flex items-center">
                <Clock size={12} className="mr-1" />
                <span>{new Date(card.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});

export { SortableCard, type Card, type User, type SortableCardProps };