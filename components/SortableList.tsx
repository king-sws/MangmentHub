/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useCallback, useMemo, forwardRef, memo, useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  MoreVertical, 
  Trash2, 
  GripVertical, 
  Edit3,
  Copy,
  Archive,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ListActionCallback = () => void | Promise<void>;

export interface SortableListTheme {
  container?: string;
  card?: string;
  header?: string;
  content?: string;
  footer?: string;
  button?: string;
  badge?: string;
}

export type ListPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ListStatus = 'active' | 'completed' | 'archived' | 'draft';

export interface SortableListConfig {
  isDragDisabled?: boolean;
  isAddDisabled?: boolean;
  isDeleteDisabled?: boolean;
  showTaskCounter?: boolean;
  showPriority?: boolean;
  showStatus?: boolean;
  titleMaxLength?: number;
  isCompact?: boolean;
  showGradientBorder?: boolean;
  enableHoverEffects?: boolean;
  allowPriorityChange?: boolean;
  allowStatusChange?: boolean;
  // NEW: Enable local state management when no external handlers provided
  useLocalState?: boolean;
}

export interface SortableListAnalytics {
  onDragStart?: (listId: string) => void;
  onDragEnd?: (listId: string) => void;
  onAddCardClick?: (listId: string) => void;
  onDeleteListClick?: (listId: string) => void;
  onEditListClick?: (listId: string) => void;
  onDuplicateListClick?: (listId: string) => void;
  onArchiveListClick?: (listId: string) => void;
  onPriorityChange?: (listId: string, priority: ListPriority) => void;
  onStatusChange?: (listId: string, status: ListStatus) => void;
}

export interface SortableListProps {
  id: string;
  listId: string;
  title: string;
  children: ReactNode;
  subtitle?: string;
  taskCount?: number;
  completedCount?: number;
  priority?: ListPriority;
  status?: ListStatus;
  onPriorityChange?: (priority: ListPriority) => void | Promise<void>;
  onStatusChange?: (status: ListStatus) => void | Promise<void>;
  onAddCard?: ListActionCallback;
  onDeleteList?: ListActionCallback;
  onEditList?: ListActionCallback;
  onDuplicateList?: ListActionCallback;
  onArchiveList?: ListActionCallback;
  className?: string;
  maxHeight?: string;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  theme?: SortableListTheme;
  config?: SortableListConfig;
  analytics?: SortableListAnalytics;
  testId?: string;
  ariaLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<SortableListConfig> = {
  isDragDisabled: false,
  isAddDisabled: false,
  isDeleteDisabled: false,
  showTaskCounter: true,
  showPriority: true,
  showStatus: true,
  titleMaxLength: 30,
  isCompact: false,
  showGradientBorder: false,
  enableHoverEffects: true,
  allowPriorityChange: true,
  allowStatusChange: true,
  useLocalState: true, // NEW: Default to true for better UX
} as const;

const ANIMATION_DURATION = 200;
const DEFAULT_MAX_HEIGHT = "65vh";
const DEFAULT_WIDTH = "23rem"; 

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
} as const;

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  archived: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
} as const;

const PRIORITY_ICONS = {
  low: Clock,
  medium: AlertCircle,
  high: AlertTriangle,
  urgent: XCircle,
} as const;

const STATUS_ICONS = {
  active: Clock,
  completed: CheckCircle,
  archived: Archive,
  draft: Edit3,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const generateClassNames = (
  baseClasses: string,
  conditionalClasses: Record<string, boolean>,
  customClasses?: string
): string => {
  const classes = [
    baseClasses,
    ...Object.entries(conditionalClasses)
      .filter(([, condition]) => condition)
      .map(([className]) => className),
    customClasses,
  ].filter(Boolean);
  
  return cn(...classes);
};

const getPriorityColor = (priority: ListPriority): string => {
  return PRIORITY_COLORS[priority];
};

const getStatusColor = (status: ListStatus): string => {
  return STATUS_COLORS[status];
};

// ============================================================================
// HELPER FUNCTIONS FOR CYCLING THROUGH OPTIONS
// ============================================================================

const getNextPriority = (currentPriority: ListPriority): ListPriority => {
  const priorities: ListPriority[] = ['low', 'medium', 'high', 'urgent'];
  const currentIndex = priorities.indexOf(currentPriority);
  return priorities[(currentIndex + 1) % priorities.length];
};

const getNextStatus = (currentStatus: ListStatus): ListStatus => {
  const statuses: ListStatus[] = ['active', 'draft', 'completed', 'archived'];
  const currentIndex = statuses.indexOf(currentStatus);
  return statuses[(currentIndex + 1) % statuses.length];
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LoadingSkeleton = memo(() => (
  <div className="space-y-3 p-2">
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-muted rounded-md"></div>
      <div className="h-3 bg-muted rounded-md w-3/4"></div>
      <div className="h-3 bg-muted rounded-md w-1/2"></div>
    </div>
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-muted rounded-md"></div>
      <div className="h-3 bg-muted rounded-md w-2/3"></div>
    </div>
  </div>
));
LoadingSkeleton.displayName = "LoadingSkeleton";

const ErrorState = memo(({ title, message }: { title: string; message?: string }) => (
  <div className="flex items-center p-3 text-destructive bg-destructive/10 rounded-md border border-destructive/20">
    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">Error loading {title}</p>
      {message && (
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      )}
    </div>
  </div>
));
ErrorState.displayName = "ErrorState";

const TaskCounter = memo(({ count, completedCount }: { count: number; completedCount?: number }) => {
  const hasProgress = completedCount !== undefined;
  const progress = hasProgress ? Math.round((completedCount / count) * 100) : 0;
  
  return (
    <div className="flex items-center space-x-2">
      <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
        {count}
      </Badge>
      {hasProgress && count > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-1">
                <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {progress}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{completedCount} of {count} tasks completed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
});
TaskCounter.displayName = "TaskCounter";

const PriorityBadge = memo(({ 
  priority, 
  onClick, 
  disabled = false 
}: { 
  priority: ListPriority; 
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const Icon = PRIORITY_ICONS[priority];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs capitalize border flex items-center gap-1 transition-all duration-200",
              getPriorityColor(priority),
              onClick && !disabled && "cursor-pointer hover:scale-105 hover:shadow-sm",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={!disabled ? onClick : undefined}
          >
            <Icon className="w-3 h-3" />
            {priority}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{onClick && !disabled ? `Click to change priority (currently ${priority})` : `Priority: ${priority}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
PriorityBadge.displayName = "PriorityBadge";

const StatusBadge = memo(({ 
  status, 
  onClick, 
  disabled = false 
}: { 
  status: ListStatus; 
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const Icon = STATUS_ICONS[status];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs capitalize border flex items-center gap-1 transition-all duration-200",
              getStatusColor(status),
              onClick && !disabled && "cursor-pointer hover:scale-105 hover:shadow-sm",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={!disabled ? onClick : undefined}
          >
            <Icon className="w-3 h-3" />
            {status}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{onClick && !disabled ? `Click to change status (currently ${status})` : `Status: ${status}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
StatusBadge.displayName = "StatusBadge";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SortableList = memo(forwardRef<HTMLDivElement, SortableListProps>(({
  id,
  listId,
  title,
  children,
  subtitle,
  taskCount = 0,
  completedCount,
  priority: propPriority = 'medium',
  status: propStatus = 'active',
  onPriorityChange,
  onStatusChange,
  onAddCard,
  onDeleteList,
  onEditList,
  onDuplicateList,
  onArchiveList,
  className,
  maxHeight = DEFAULT_MAX_HEIGHT,
  isLoading = false,
  hasError = false,
  errorMessage,
  theme = {},
  config = {},
  analytics,
  testId,
  ariaLabel,
}: SortableListProps, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // NEW: Local state management for priority and status
  const [localPriority, setLocalPriority] = useState<ListPriority>(propPriority);
  const [localStatus, setLocalStatus] = useState<ListStatus>(propStatus);
  
  // Merge default configuration with provided config
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  // NEW: Determine if we should use local state
  const useLocalState = mergedConfig.useLocalState && (!onPriorityChange || !onStatusChange);
  
  // NEW: Use local state or props based on configuration
  const currentPriority = useLocalState ? localPriority : propPriority;
  const currentStatus = useLocalState ? localStatus : propStatus;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: mergedConfig.isDragDisabled,
    data: {
      type: "list",
      listId,
    },
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAddCard = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isDragging || mergedConfig.isAddDisabled) return;
    
    try {
      analytics?.onAddCardClick?.(listId);
      await onAddCard?.();
    } catch (error) {
      console.error("Error adding card:", error);
    }
  }, [onAddCard, isDragging, mergedConfig.isAddDisabled, analytics, listId]);

  const handleDeleteList = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isDragging || mergedConfig.isDeleteDisabled) return;
    
    try {
      analytics?.onDeleteListClick?.(listId);
      await onDeleteList?.();
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  }, [onDeleteList, isDragging, mergedConfig.isDeleteDisabled, analytics, listId]);

  const handleEditList = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isDragging) return;
    
    try {
      analytics?.onEditListClick?.(listId);
      await onEditList?.();
    } catch (error) {
      console.error("Error editing list:", error);
    }
  }, [onEditList, isDragging, analytics, listId]);

  const handleDuplicateList = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isDragging) return;
    
    try {
      analytics?.onDuplicateListClick?.(listId);
      await onDuplicateList?.();
    } catch (error) {
      console.error("Error duplicating list:", error);
    }
  }, [onDuplicateList, isDragging, analytics, listId]);

  const handleArchiveList = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isDragging) return;
    
    try {
      analytics?.onArchiveListClick?.(listId);
      await onArchiveList?.();
    } catch (error) {
      console.error("Error archiving list:", error);
    }
  }, [onArchiveList, isDragging, analytics, listId]);

  // NEW: Enhanced priority change handler
  const handlePriorityChange = useCallback(async (newPriority: ListPriority) => {
    if (isDragging) return;
    
    try {
      analytics?.onPriorityChange?.(listId, newPriority);
      
      if (onPriorityChange) {
        await onPriorityChange(newPriority);
      } else if (useLocalState) {
        setLocalPriority(newPriority);
      }
    } catch (error) {
      console.error("Error changing priority:", error);
    }
  }, [onPriorityChange, isDragging, analytics, listId, useLocalState]);

  // NEW: Enhanced status change handler
  const handleStatusChange = useCallback(async (newStatus: ListStatus) => {
    if (isDragging) return;
    
    try {
      analytics?.onStatusChange?.(listId, newStatus);
      
      if (onStatusChange) {
        await onStatusChange(newStatus);
      } else if (useLocalState) {
        setLocalStatus(newStatus);
      }
    } catch (error) {
      console.error("Error changing status:", error);
    }
  }, [onStatusChange, isDragging, analytics, listId, useLocalState]);

  // NEW: Quick badge click handlers (cycles through options)
  const handlePriorityBadgeClick = useCallback(() => {
    if (!mergedConfig.allowPriorityChange) return;
    const nextPriority = getNextPriority(currentPriority);
    handlePriorityChange(nextPriority);
  }, [currentPriority, handlePriorityChange, mergedConfig.allowPriorityChange]);

  const handleStatusBadgeClick = useCallback(() => {
    if (!mergedConfig.allowStatusChange) return;
    const nextStatus = getNextStatus(currentStatus);
    handleStatusChange(nextStatus);
  }, [currentStatus, handleStatusChange, mergedConfig.allowStatusChange]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const containerStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : 1,
    width: DEFAULT_WIDTH,
  }), [transform, transition, isDragging]);

  const truncatedTitle = useMemo(() => 
    truncateText(title, mergedConfig.titleMaxLength),
    [title, mergedConfig.titleMaxLength]
  );

  // ============================================================================
  // CLASS NAME GENERATION
  // ============================================================================

  const containerClasses = generateClassNames(
    "flex-shrink-0 transition-all duration-200",
    {
      "pointer-events-none": isDragging,
      "opacity-50": isLoading,
    },
    cn(theme.container, className)
  );

  const cardClasses = generateClassNames(
    "bg-card border border-border shadow-sm overflow-hidden transition-all duration-200 group",
    {
      "shadow-lg border-primary/20": isDragging,
      "shadow-md": isHovered && mergedConfig.enableHoverEffects && !isDragging,
      "border-destructive/50": hasError,
      "bg-gradient-to-br from-card via-card to-muted/10": mergedConfig.showGradientBorder && !isDragging,
    },
    theme.card
  );

  const headerClasses = generateClassNames(
    "p-4 bg-card/50 backdrop-blur-sm border-b border-border transition-all duration-200",
    {
      "cursor-grab active:cursor-grabbing": !mergedConfig.isDragDisabled,
      "hover:bg-muted/50": !isDragging && !mergedConfig.isDragDisabled && mergedConfig.enableHoverEffects,
      "cursor-not-allowed": mergedConfig.isDragDisabled,
      "bg-muted/30": isDragging,
      "p-3": mergedConfig.isCompact,
    },
    theme.header
  );

  const contentClasses = generateClassNames(
    "p-3 space-y-2 overflow-y-auto scrollbar-thin custom-scrollbar scrollbar-track-muted scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
    {
      "p-2": mergedConfig.isCompact,
    },
    theme.content
  );

  const footerClasses = generateClassNames(
    "p-3 pt-0 bg-card/50 backdrop-blur-sm",
    {
      "p-2 pt-0": mergedConfig.isCompact,
    },
    theme.footer
  );

  // ============================================================================
  // RENDER PRIORITY MENU
  // ============================================================================

  const renderPriorityMenu = () => {
    if (!mergedConfig.allowPriorityChange) return null;

    const priorities: ListPriority[] = ['low', 'medium', 'high', 'urgent'];
    
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="cursor-pointer text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          Change Priority
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {priorities.map((priorityOption) => {
            const Icon = PRIORITY_ICONS[priorityOption];
            return (
              <DropdownMenuItem
                key={priorityOption}
                className={cn(
                  "cursor-pointer text-sm capitalize",
                  currentPriority === priorityOption && "bg-accent"
                )}
                onClick={() => handlePriorityChange(priorityOption)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {priorityOption}
                {currentPriority === priorityOption && (
                  <CheckCircle className="h-3 w-3 ml-auto" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  };

  // ============================================================================
  // RENDER STATUS MENU
  // ============================================================================

  const renderStatusMenu = () => {
    if (!mergedConfig.allowStatusChange) return null;

    const statuses: ListStatus[] = ['active', 'completed', 'archived', 'draft'];
    
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="cursor-pointer text-sm">
          <Clock className="h-4 w-4 mr-2" />
          Change Status
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {statuses.map((statusOption) => {
            const Icon = STATUS_ICONS[statusOption];
            return (
              <DropdownMenuItem
                key={statusOption}
                className={cn(
                  "cursor-pointer text-sm capitalize",
                  currentStatus === statusOption && "bg-accent"
                )}
                onClick={() => handleStatusChange(statusOption)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {statusOption}
                {currentStatus === statusOption && (
                  <CheckCircle className="h-3 w-3 ml-auto" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (ref) {
          if (typeof ref === "function") {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      }}
      style={containerStyle}
      className={containerClasses}
      data-list-id={listId}
      data-testid={testId}
      role="region"
      aria-label={ariaLabel || `List: ${title}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={cardClasses}>
        {/* Header with drag handle and options */}
        <CardHeader className="p-0">
          <div
            className={headerClasses}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={mergedConfig.isDragDisabled ? -1 : 0}
            aria-label={`Drag handle for ${title} list`}
          >
            <div className="flex items-start justify-between w-full">
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 w-full items-start">
                {!mergedConfig.isDragDisabled && (
                  <div className="pt-0.5">
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>                
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <h3 
                      className="text-foreground font-semibold text-sm truncate min-w-[50px]" 
                      title={title}
                    >
                      {truncatedTitle}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {mergedConfig.showStatus && (
                        <StatusBadge 
                          status={currentStatus} 
                          onClick={mergedConfig.allowStatusChange ? handleStatusBadgeClick : undefined}
                          disabled={!mergedConfig.allowStatusChange}
                        />
                      )}
                      {mergedConfig.showPriority && (
                        <PriorityBadge 
                          priority={currentPriority} 
                          onClick={mergedConfig.allowPriorityChange ? handlePriorityBadgeClick : undefined}
                          disabled={!mergedConfig.allowPriorityChange}
                        />
                      )}
                    </div>
                  </div>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  )}
                  {mergedConfig.showTaskCounter && taskCount > 0 && (
                    <div className="mt-2">
                      <TaskCounter count={taskCount} completedCount={completedCount} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* List options dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-md transition-all opacity-0 group-hover:opacity-100 hover:bg-muted data-[state=open]:opacity-100 data-[state=open]:bg-muted"
                    aria-label="List options"
                    disabled={isDragging || isLoading}
                    data-testid={`${testId}-options`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-popover border-border shadow-lg"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    List Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {onEditList && (
                      <DropdownMenuItem
                        className="cursor-pointer text-sm hover:bg-muted focus:bg-muted"
                        onClick={handleEditList}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit List
                      </DropdownMenuItem>
                    )}
                    {onDuplicateList && (
                      <DropdownMenuItem
                        className="cursor-pointer text-sm hover:bg-muted focus:bg-muted"
                        onClick={handleDuplicateList}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate List
                      </DropdownMenuItem>
                    )}
                    {onArchiveList && (
                      <DropdownMenuItem
                        className="cursor-pointer text-sm hover:bg-muted focus:bg-muted"
                        onClick={handleArchiveList}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive List
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>

                  {/* Priority and Status Change Submenus */}
                  {(renderPriorityMenu() || renderStatusMenu()) && (
                    <DropdownMenuSeparator />
                  )}
                  
                  {renderPriorityMenu()}
                  {renderStatusMenu()}

                  {/* Destructive Actions */}
                  {onDeleteList && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                        onClick={handleDeleteList}
                        disabled={mergedConfig.isDeleteDisabled}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete List
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Content Area */}
        <CardContent className="p-0">
          <div 
            className={contentClasses}
            style={{ maxHeight }}
            data-testid={`${testId}-content`}
          >
            {isLoading && <LoadingSkeleton />}
            {hasError && <ErrorState title={title} message={errorMessage} />}
            {!isLoading && !hasError && children}
          </div>
        </CardContent>

        {/* Footer with Add Card Button */}
        <CardFooter className="p-0">
          <div className={footerClasses}>
            {onAddCard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddCard}
                disabled={isDragging || mergedConfig.isAddDisabled || isLoading}
                className={cn(
                  "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-md",
                  "border-dashed border-2 border-transparent hover:border-muted-foreground/20",
                  "group/add-btn",
                  mergedConfig.isCompact && "py-2 text-xs",
                  theme.button
                )}
                data-testid={`${testId}-add-card`}
                aria-label={`Add card to ${title}`}
              >
                <Plus className="h-4 w-4 mr-2 transition-transform group-hover/add-btn:rotate-90" />
                Add a card
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}));

SortableList.displayName = "SortableList";

// ============================================================================
// EXPORT
// ============================================================================

export default SortableList;