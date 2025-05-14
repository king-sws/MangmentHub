/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardContent } from "@/components/BoardContent";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  CheckCircle2, 
  Filter, 
  Loader2,
  X,
  RefreshCcw,
  ListFilter,
  Clock,
  Check
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  isToday,
  parseISO,
  addDays 
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types
interface Board {
  id: string;
  title: string;
  workspaceId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date | null;
  lists: List[];
}

interface List {
  id: string;
  title: string;
  boardId: string;
  cards: CardItem[];
}

interface CardItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  status: CardStatus;
  listId: string;
  list?: {
    id: string;
    title: string;
    board?: {
      id: string;
      title: string;
    };
  };
  assignees?: {
    id: string;
    name?: string | null;
    email: string;
  }[];
}

type CardStatus = 'todo' | 'in_progress' | 'done' | 'canceled';
type ViewMode = 'month' | 'week';

// Status mapping for visual elements - theme aware
const STATUS_STYLES = {
  todo: { 
    bg: "bg-slate-100 dark:bg-slate-800", 
    text: "text-slate-800 dark:text-slate-200", 
    border: "border-slate-300 dark:border-slate-600",
    label: "To Do" 
  },
  in_progress: { 
    bg: "bg-blue-100 dark:bg-blue-900/30", 
    text: "text-blue-800 dark:text-blue-300", 
    border: "border-blue-300 dark:border-blue-800",
    label: "In Progress" 
  },
  done: { 
    bg: "bg-green-100 dark:bg-green-900/30", 
    text: "text-green-800 dark:text-green-300", 
    border: "border-green-300 dark:border-green-800",
    label: "Done" 
  },
  canceled: { 
    bg: "bg-red-100 dark:bg-red-900/30", 
    text: "text-red-800 dark:text-red-300", 
    border: "border-red-300 dark:border-red-800",
    label: "Canceled" 
  },
  default: { 
    bg: "bg-gray-100 dark:bg-gray-800", 
    text: "text-gray-800 dark:text-gray-200", 
    border: "border-gray-300 dark:border-gray-700",
    label: "Status" 
  }
};

/**
 * Calendar Page Component
 * Displays tasks in both calendar and board views with filtering and drag-drop capabilities
 */
export default function CalendarPage({ params }: { params: Promise<{ userId: string }> | { userId: string } }) {
  // Use React.use to unwrap params if it's a Promise
  const resolvedParams = 'then' in params ? use(params) : params;
  const { userId } = resolvedParams;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardIdParam = searchParams.get('boardId');
  
  // Board state
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [cards, setCards] = useState<CardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedItems, setSelectedItems] = useState<CardItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<CardItem | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<CardStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [boardViewCompact, setBoardViewCompact] = useState(false);

  /**
   * Fetch all boards the user has access to
   */
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        // Get all workspaces first
        const wsResponse = await fetch(`/api/workspace?userId=${userId}`);
        
        if (!wsResponse.ok) {
          throw new Error("Failed to fetch workspaces");
        }
        
        const workspaces = await wsResponse.json();
        const allBoards: Board[] = [];
        
        // Fetch boards for each workspace using Promise.all for parallel requests
        const boardPromises = workspaces.map((workspace: any) => 
          fetch(`/api/board?workspaceId=${workspace.id}`)
            .then(res => res.ok ? res.json() : [])
        );
        
        const boardResults = await Promise.all(boardPromises);
        boardResults.forEach(workspaceBoards => {
          allBoards.push(...workspaceBoards);
        });
        
        setBoards(allBoards);
        
        // If boardId is in URL params, select that board
        if (boardIdParam) {
          const matchingBoard = allBoards.find(board => board.id === boardIdParam);
          if (matchingBoard) {
            setSelectedBoard(matchingBoard);
            // Load the full board data with lists and cards
            loadFullBoardData(boardIdParam);
          }
        }
      } catch (error) {
        console.error("Error fetching boards:", error);
        toast.error("Failed to load boards");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBoards();
  }, [userId, boardIdParam]);

  /**
   * Load full board data with lists and cards
   */
  const loadFullBoardData = async (boardId: string) => {
    try {
      const response = await fetch(`/api/board/${boardId}/full`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch board: ${response.status}`);
      }

      const boardData = await response.json();
      // Ensure lists and cards are included
      setSelectedBoard({
        ...boardData,
        lists: boardData.lists || []
      });
    } catch (error) {
      console.error("Error loading full board data:", error);
      toast.error("Failed to load board details");
    }
  };

  /**
   * Fetch calendar data
   */
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate date range for the current view
      const firstDay = startOfWeek(startOfMonth(currentMonth));
      const lastDay = endOfWeek(endOfMonth(currentMonth));
      
      // Build the query URL
      let url = `/api/calendar?userId=${userId}`;
      url += `&startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`;
      
      // Add board filter if specified
      if (selectedBoard?.id) {
        url += `&boardId=${selectedBoard.id}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar data: ${response.status}`);
      }
      
      const cardsData = await response.json();
      
      // Process the cards
      const processedCards = cardsData.map((card: CardItem) => ({
        ...card,
        dueDate: card.dueDate ? card.dueDate : null
      }));
      
      setCards(processedCards);
      console.log("Loaded calendar items:", processedCards.length);
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError(err instanceof Error ? err.message : "Could not load your calendar data");
      toast.error("Failed to load calendar data");
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentMonth, selectedBoard?.id]);

  /**
   * Refresh calendar data
   */
  const refreshCalendarData = async () => {
    setIsRefreshing(true);
    await fetchCalendarData();
    setIsRefreshing(false);
    toast.success("Calendar data refreshed");
  };

  // Load calendar data when dependencies change
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  /**
   * Handle board selection
   */
  const handleBoardChange = (boardId: string) => {
    if (boardId === "all") {
      setSelectedBoard(null);
      router.push(`/dashboard/${userId}/calendar`);
      return;
    }
    
    const selected = boards.find(board => board.id === boardId) || null;
    setSelectedBoard(selected);
    
    if (selected) {
      // Update URL with boardId parameter
      router.push(`/dashboard/${userId}/calendar?boardId=${boardId}`);
      // Load full board data
      loadFullBoardData(boardId);
    }
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  /**
   * Calculate days for the current view (memoized)
   */
  const { daysInView, startDate, endDate } = useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);
    const startDate = viewMode === "month" 
      ? startOfWeek(firstDayOfMonth) 
      : startOfWeek(currentMonth);
    const endDate = viewMode === "month"
      ? endOfWeek(lastDayOfMonth)
      : endOfWeek(addDays(startDate, 6));
    
    return {
      daysInView: eachDayOfInterval({ start: startDate, end: endDate }),
      startDate,
      endDate
    };
  }, [currentMonth, viewMode]);

  /**
   * Find items for a specific day (with memoization for better performance)
   */
  const getItemsForDay = useCallback((day: Date) => {
    return cards.filter(item => {
      if (!item.dueDate) return false;
      
      // Apply status filter if active
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }
      
      const itemDate = parseISO(item.dueDate);
      return isSameDay(day, itemDate);
    });
  }, [cards, statusFilter]);

  /**
   * Handle navigation based on view mode
   */
  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addDays(currentMonth, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addDays(currentMonth, 7));
    }
  };

  /**
   * Switch to today
   */
  const handleGoToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
    
    // Get items for today
    const todayItems = getItemsForDay(new Date());
    setSelectedItems(todayItems);
  };

  /**
   * Handle day selection
   */
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const dayItems = getItemsForDay(day);
    setSelectedItems(dayItems);
  };

  /**
   * Handle item status toggle
   */
  const handleToggleComplete = async (item: CardItem) => {
    try {
      const response = await fetch(`/api/cards/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Update local state
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === item.id ? { ...card, completed: !item.completed } : card
        )
      );
      
      // Update selected items if necessary
      setSelectedItems(prevItems => 
        prevItems.map(selectedItem => 
          selectedItem.id === item.id ? { ...selectedItem, completed: !item.completed } : selectedItem
        )
      );
      
      toast.success("Card status updated");
    } catch (err) {
      console.error("Error toggling item completion:", err);
      toast.error("Failed to update status");
    }
  };

  /**
   * Handle viewing card details
   */
  const handleViewDetails = (item: CardItem) => {
    if (item.list?.board) {
      router.push(`/dashboard/${userId}/boards/${item.list.board.id}?cardId=${item.id}`);
    } else {
      toast.error("Could not locate the board for this card");
    }
  };

  /**
   * Drag and drop handlers
   */
  const handleDragStart = (e: React.DragEvent, item: CardItem) => {
    e.dataTransfer.setData('cardId', item.id);
    setDraggedItem(item);
    // Add a visual effect to show the item is being dragged
    e.currentTarget.classList.add('opacity-50', 'ring-2', 'ring-primary');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Remove the visual effect when drag ends
    e.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-primary');
  };

  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    
    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId || !draggedItem) return;
    
    try {
      // Show loading state
      const toastId = toast.loading("Moving card...");
      
      // Update the card's due date
      const response = await fetch(`/api/calendar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          id: cardId,
          dueDate: day.toISOString()
        }])
      });
      
      if (!response.ok) {
        throw new Error("Failed to update card due date");
      }
      
      const result = await response.json();
      if (result[0]?.success) {
        // Update local state
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === cardId ? { ...card, dueDate: day.toISOString() } : card
          )
        );
        
        // Update selected items if necessary
        if (selectedDay && draggedItem.dueDate && isSameDay(selectedDay, parseISO(draggedItem.dueDate))) {
          setSelectedItems(prev => prev.filter(item => item.id !== cardId));
        }
        
        if (selectedDay && isSameDay(selectedDay, day)) {
          const updatedCard = { ...draggedItem, dueDate: day.toISOString() };
          setSelectedItems(prev => [...prev, updatedCard]);
        }
        
        toast.dismiss(toastId);
        toast.success("Card moved successfully");
      } else {
        toast.dismiss(toastId);
        toast.error(result[0]?.error || "Failed to move card");
      }
    } catch (err) {
      console.error("Error updating card due date:", err);
      toast.error("Failed to move card");
    } finally {
      setDraggedItem(null);
    }
  };

  /**
   * Handle updating a card's status
   */
  const handleUpdateStatus = async (item: CardItem, newStatus: CardStatus) => {
    try {
      const response = await fetch(`/api/cards/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Update local state
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === item.id ? { ...card, status: newStatus } : card
        )
      );
      
      // Update selected items if necessary
      setSelectedItems(prevItems => 
        prevItems.map(selectedItem => 
          selectedItem.id === item.id ? { ...selectedItem, status: newStatus } : selectedItem
        )
      );
      
      toast.success(`Status updated to ${STATUS_STYLES[newStatus].label}`);
    } catch (err) {
      console.error("Error updating card status:", err);
      toast.error("Failed to update status");
    }
  };

  /**
   * Helper to get status styles
   */
  const getStatusStyle = (status: string) => {
    return STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.default;
  };

  /**
   * Render loading skeleton
   */
  const renderSkeleton = () => (
    <div className="space-y-4" aria-busy="true" aria-label="Loading calendar">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array(7).fill(0).map((_, idx) => (
          <Skeleton key={`header-${idx}`} className="h-10" />
        ))}
        
        {Array(35).fill(0).map((_, idx) => (
          <Skeleton key={`day-${idx}`} className="h-28" />
        ))}
      </div>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30" aria-live="polite">
      <CardHeader>
        <CardTitle className="text-red-800 dark:text-red-300">Error Loading Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-800 dark:text-red-300 mb-4">{error}</p>
        <Button 
          onClick={refreshCalendarData} 
          variant="outline" 
          className="border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  /**
   * Render a single calendar day cell
   */
  const renderDayCell = (day: Date, dayIndex: number) => {
    const dayItems = getItemsForDay(day);
    const isCurrentDay = isToday(day);
    const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
    const isDragOver = dragOverDay ? isSameDay(day, dragOverDay) : false;
    const isCurrentMonth = isSameMonth(day, currentMonth);
    
    return (
      <div
        key={dayIndex}
        className={cn(
          "min-h-28 p-1 border rounded-md overflow-hidden transition-all",
          isCurrentDay && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
          isSelected && "ring-2 ring-primary border-primary",
          isDragOver && "ring-2 ring-primary/70 bg-primary/5 dark:bg-primary/10 border-primary/40 dark:border-primary/60",
          !isCurrentMonth && viewMode === "month" && "opacity-50 bg-muted/10 dark:bg-muted/5",
          "hover:border-primary/50 cursor-pointer"
        )}
        onClick={() => handleDayClick(day)}
        onDragOver={(e) => handleDragOver(e, day)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day)}
        aria-label={format(day, 'EEEE, MMMM d, yyyy')}
        data-day={format(day, 'yyyy-MM-dd')}
        role="gridcell"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleDayClick(day);
          }
        }}
      >
        <div className="flex justify-between items-center h-7">
          <span className={cn(
            "flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full",
            isCurrentDay && "bg-primary text-primary-foreground",
            !isCurrentDay && isSelected && "bg-primary/10 dark:bg-primary/20"
          )}>
            {format(day, 'd')}
          </span>
          {dayItems.length > 0 && (
            <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary text-xs">
              {dayItems.length}
            </Badge>
          )}
        </div>
        <div className="mt-1 space-y-1 max-h-[calc(100%-28px)] overflow-y-auto">
          {dayItems.slice(0, 4).map((item) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <TooltipProvider key={item.id}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "text-xs p-1.5 rounded border-l-2 truncate cursor-grab transition-all group",
                        item.completed 
                          ? "bg-muted/50 dark:bg-muted/30 line-through text-muted-foreground border-muted-foreground" 
                          : `bg-white dark:bg-muted/20 hover:bg-opacity-80 dark:hover:bg-opacity-30 ${statusStyle.border}`
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      aria-label={`${item.title} - ${statusStyle.label}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.bg}`} />
                        <span className="truncate">{item.title}</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${statusStyle.bg}`}></span>
                        <span>{statusStyle.label}</span>
                      </div>
                      {item.list && (
                        <p className="text-muted-foreground">
                          {item.list.board?.title && `${item.list.board.title} • `}{item.list.title}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {dayItems.length > 4 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-auto py-0.5 text-xs text-muted-foreground hover:text-primary flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                handleDayClick(day);
              }}
            >
              <span>+{dayItems.length - 4} more</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render selected day details panel
   */
  const renderSelectedDayPanel = () => {
    if (!selectedDay) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
            <CardTitle className="text-base">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
              {isToday(selectedDay) && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                  Today
                </Badge>
              )}
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => setSelectedDay(null)}
            aria-label="Close selected day panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {selectedItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No items scheduled for this day
            </div>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((item) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-center gap-2 p-2 border rounded-md group transition-all",
                      item.completed 
                        ? "bg-muted/50 dark:bg-muted/30 border-muted" 
                        : `bg-white dark:bg-muted/10 ${statusStyle.border}`
                    )}
                  >
                    <Checkbox 
                      id={`complete-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={() => handleToggleComplete(item)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium text-sm flex gap-2 items-center",
                        item.completed && "line-through text-muted-foreground"
                      )}>
                        <span className="truncate">{item.title}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge 
                              className={cn(
                                "text-xs h-5 cursor-pointer",
                                statusStyle.bg,
                                statusStyle.text
                              )}
                            >
                              {statusStyle.label}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent sideOffset={5}>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item, "todo")}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item, "in_progress")}>
                              <Clock className="w-4 h-4 mr-2" /> In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item, "done")}>
                              <Check className="w-4 h-4 mr-2" /> Done
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(item, "canceled")}>
                              <X className="w-4 h-4 mr-2" /> Canceled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {item.list && (
                        <p className="text-xs text-muted-foreground">
                          {item.list.board?.title && `${item.list.board.title} • `}{item.list.title}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

    function renderCalendar(): React.ReactNode {
        if (isLoading) return renderSkeleton();
        if (error) return renderError();

        return (
            <div>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    {/* Board Selector */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedBoard?.id || "all"}
                            onValueChange={handleBoardChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select Board" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Boards</SelectItem>
                                {boards.map((board) => (
                                    <SelectItem key={board.id} value={board.id}>
                                        {board.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={refreshCalendarData}
                            disabled={isRefreshing}
                            aria-label="Refresh"
                        >
                            {isRefreshing ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <RefreshCcw className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    {/* View Mode, Status Filter, Navigation */}
                    <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={statusFilter ? "default" : "outline"}
                                    size="sm"
                                    className="flex items-center gap-1"
                                    aria-label="Filter by status"
                                >
                                    <ListFilter className="w-4 h-4" />
                                    {statusFilter ? STATUS_STYLES[statusFilter].label : "Status"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2">
                                <div className="flex flex-col gap-1">
                                    <Button
                                        variant={!statusFilter ? "default" : "ghost"}
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => setStatusFilter(null)}
                                    >
                                        All Statuses
                                    </Button>
                                    {(["todo", "in_progress", "done", "canceled"] as CardStatus[]).map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? "default" : "ghost"}
                                            size="sm"
                                            className="justify-start"
                                            onClick={() => setStatusFilter(status)}
                                        >
                                            {STATUS_STYLES[status].label}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* View Mode Switch */}
                        <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)} className="w-auto">
                            <TabsList>
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="week">Week</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Navigation */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevious}
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleGoToToday}
                            aria-label="Today"
                        >
                            <CalendarIcon className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNext}
                            aria-label="Next"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                        <span className="ml-2 font-medium text-base">
                            {viewMode === "month"
                                ? format(currentMonth, "MMMM yyyy")
                                : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`}
                        </span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1" role="grid">
                    {/* Weekday headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                            key={day}
                            className="text-xs font-semibold text-center py-2 text-muted-foreground"
                            role="columnheader"
                            aria-label={day}
                        >
                            {day}
                        </div>
                    ))}
                    {/* Days */}
                    {daysInView.map((day, idx) => renderDayCell(day, idx))}
                </div>
            </div>
        );
    }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Calendar</h2>
      </div>
      {renderCalendar()}
      {renderSelectedDayPanel()}
    </div>
  );
};