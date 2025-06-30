/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useCallback, useMemo, forwardRef, memo } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash2, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Callback function type for list actions
 */
export type ListActionCallback = () => void | Promise<void>;

/**
 * Theme configuration for the sortable list
 */
export interface SortableListTheme {
  container?: string;
  card?: string;
  header?: string;
  content?: string;
  footer?: string;
  button?: string;
}

/**
 * Configuration for list behavior
 */
export interface SortableListConfig {
  /** Enable/disable drag functionality */
  isDragDisabled?: boolean;
  /** Enable/disable add card functionality */
  isAddDisabled?: boolean;
  /** Enable/disable delete list functionality */
  isDeleteDisabled?: boolean;
  /** Show/hide task counter */
  showTaskCounter?: boolean;
  /** Maximum number of characters for title truncation */
  titleMaxLength?: number;
}

/**
 * Analytics tracking configuration
 */
export interface SortableListAnalytics {
  /** Track drag events */
  onDragStart?: (listId: string) => void;
  /** Track drop events */
  onDragEnd?: (listId: string) => void;
  /** Track add card events */
  onAddCardClick?: (listId: string) => void;
  /** Track delete list events */
  onDeleteListClick?: (listId: string) => void;
}

/**
 * Comprehensive props interface for the SortableList component
 */
export interface SortableListProps {
  /** Unique identifier for the sortable element */
  id: string;
  /** List identifier for data organization */
  listId: string;
  /** Display title of the list */
  title: string;
  /** Child components to render within the list */
  children: ReactNode;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Number of tasks in the list (for counter display) */
  taskCount?: number;
  /** Callback function triggered when adding a new card */
  onAddCard?: ListActionCallback;
  /** Callback function triggered when deleting the list */
  onDeleteList?: ListActionCallback;
  /** Callback function triggered when editing the list */
  onEditList?: ListActionCallback;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional maximum height for the content area */
  maxHeight?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  hasError?: boolean;
  /** Custom theme configuration */
  theme?: SortableListTheme;
  /** Behavior configuration */
  config?: SortableListConfig;
  /** Analytics tracking */
  analytics?: SortableListAnalytics;
  /** Test ID for automated testing */
  testId?: string;
  /** ARIA label override */
  ariaLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<SortableListConfig> = {
  isDragDisabled: false,
  isAddDisabled: false,
  isDeleteDisabled: false,
  showTaskCounter: false,
  titleMaxLength: 30,
} as const;

const ANIMATION_DURATION = 200;
const DEFAULT_MAX_HEIGHT = "65vh";
const DEFAULT_WIDTH = "18rem"; // 288px

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Truncates text to specified length with ellipsis
 */
const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

/**
 * Generates consistent class names with conditional logic
 */
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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Loading skeleton component
 */
const LoadingSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
  </div>
));
LoadingSkeleton.displayName = "LoadingSkeleton";

/**
 * Error state component
 */
const ErrorState = memo(({ title }: { title: string }) => (
  <div className="flex items-center p-2 text-red-600 dark:text-red-400 text-sm">
    <span className="mr-2">⚠️</span>
    <span>Error loading {title}</span>
  </div>
));
ErrorState.displayName = "ErrorState";

/**
 * Task counter badge component
 */
const TaskCounterBadge = memo(({ count }: { count: number }) => (
  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
    {count}
  </span>
));
TaskCounterBadge.displayName = "TaskCounterBadge";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enterprise-grade sortable list component with comprehensive features
 * 
 * Features:
 * - Drag and drop reordering with accessibility
 * - Configurable behavior and theming
 * - Loading and error states
 * - Analytics tracking
 * - Comprehensive testing support
 * - Performance optimizations
 * - Responsive design with proper theme support
 * - Keyboard navigation support
 * - Screen reader compatibility
 */
export const SortableList = memo(forwardRef<HTMLDivElement, SortableListProps>(({
  id,
  listId,
  title,
  children,
  subtitle,
  taskCount = 0,
  onAddCard,
  onDeleteList,
  onEditList,
  className,
  maxHeight = DEFAULT_MAX_HEIGHT,
  isLoading = false,
  hasError = false,
  theme = {},
  config = {},
  analytics,
  testId,
  ariaLabel,
}: SortableListProps, ref) => {
  // Merge default configuration with provided config
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

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
      // In a real enterprise app, you'd want proper error reporting here
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
      await onEditList?.();
    } catch (error) {
      console.error("Error editing list:", error);
    }
  }, [onEditList, isDragging]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      // Handle keyboard activation if needed
    }
  }, []);

  // ============================================================================
  // DRAG ANALYTICS
  // ============================================================================

  const handleDragStart = useCallback(() => {
    analytics?.onDragStart?.(listId);
  }, [analytics, listId]);

  const handleDragEnd = useCallback(() => {
    analytics?.onDragEnd?.(listId);
  }, [analytics, listId]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const containerStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1,
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

  const headerClasses = generateClassNames(
    "p-3 border-b border-gray-200 dark:border-gray-700 font-medium flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-t-md transition-colors",
    {
      "cursor-grab active:cursor-grabbing": !mergedConfig.isDragDisabled,
      "hover:bg-gray-100 dark:hover:bg-gray-700": !isDragging && !mergedConfig.isDragDisabled,
      "cursor-not-allowed": mergedConfig.isDragDisabled,
    },
    theme.header
  );

  const contentClasses = generateClassNames(
    "p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 dark:scrollbar-track-gray-800 dark:scrollbar-thumb-gray-600",
    {
      "hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500": !isDragging,
    },
    theme.content
  );

  const cardClasses = generateClassNames(
    "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-shadow duration-200",
    {
      "shadow-xl": isDragging,
      "border-red-300 dark:border-red-700": hasError,
    },
    theme.card
  );

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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center min-w-0 flex-1">
              {!mergedConfig.isDragDisabled && (
                <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h3 
                  className="text-gray-900 dark:text-white font-medium text-sm truncate" 
                  title={title}
                >
                  {truncatedTitle}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              {mergedConfig.showTaskCounter && (
                <TaskCounterBadge count={taskCount} />
              )}
            </div>
            
            {/* List options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 rounded transition-colors opacity-60 hover:bg-gray-200 dark:hover:bg-gray-600 hover:opacity-100 ml-2"
                  aria-label="List options"
                  disabled={isDragging}
                  data-testid={`${testId}-options`}
                >
                  <MoreVertical className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                {onEditList && (
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleEditList}
                  >
                    Edit List
                  </DropdownMenuItem>
                )}
                {onEditList && onDeleteList && <DropdownMenuSeparator />}
                {onDeleteList && !mergedConfig.isDeleteDisabled && (
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:text-red-700 dark:focus:text-red-300 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer text-xs"
                    onClick={handleDeleteList}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Content area with scrolling */}
        <CardContent 
          className={contentClasses}
          style={{ maxHeight }}
          role="list"
          aria-label={`Tasks in ${title}`}
          data-testid={`${testId}-content`}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : hasError ? (
            <ErrorState title={title} />
          ) : (
            children
          )}
        </CardContent>

        {/* Footer with add button */}
        <CardFooter className={cn("p-2 pt-0", theme.footer)}>
          {onAddCard && !mergedConfig.isAddDisabled && (
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start text-left border-0 h-8 text-gray-600 dark:text-gray-400 transition-colors rounded text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={handleAddCard}
              aria-label={`Add a new task to ${title}`}
              disabled={isDragging || isLoading}
              data-testid={`${testId}-add-card`}
            >
              <Plus size={12} className="mr-2" aria-hidden="true" />
              <span>Add Task</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}));

SortableList.displayName = "SortableList";

// ============================================================================
// EXPORTS
// ============================================================================

export default SortableList;

