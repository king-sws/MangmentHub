/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
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
  RefreshCcw
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
  parseISO 
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "next/navigation";

interface Board {
  id: string;
  title: string;
  workspaceId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date | null;
  lists: any[];
}

interface CardItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  status: string;
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

  const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900 flex justify-center items-center">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-blue-200/20 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-blue-100/25 to-indigo-50/15 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-indigo-200 dark:border-indigo-900 animate-pulse mx-auto"></div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
);

function CalendarPageContent({ params }: { params: Promise<{ userId: string }> | { userId: string } }) {
  // Use React.use to unwrap params if it's a Promise
  const resolvedParams = 'then' in params ? use(params) : params;
  const { userId } = resolvedParams;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardIdParam = searchParams?.get('boardId');
  
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
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all boards the user has access to
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
        
        // Fetch boards for each workspace
        for (const workspace of workspaces) {
          const boardsResponse = await fetch(`/api/board?workspaceId=${workspace.id}`);
          
          if (boardsResponse.ok) {
            const workspaceBoards = await boardsResponse.json();
            allBoards.push(...workspaceBoards);
          }
        }
        
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

  // Load full board data with lists and cards
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



  // Fetch calendar data
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

  // Refresh calendar data
  const refreshCalendarData = async () => {
    setIsRefreshing(true);
    await fetchCalendarData();
    setIsRefreshing(false);
    toast.success("Calendar data refreshed");
  };

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Handle board selection
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

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Helper to add days
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Calculate days for the current view (memoized)
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

  // Find items for a specific day (with memoization for better performance)
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

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Handle week navigation
  const handlePreviousWeek = () => {
    setCurrentMonth(addDays(currentMonth, -7));
  };

  const handleNextWeek = () => {
    setCurrentMonth(addDays(currentMonth, 7));
  };

  // Handle navigation based on view mode
  const handlePrevious = () => {
    if (viewMode === "month") {
      handlePreviousMonth();
    } else {
      handlePreviousWeek();
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      handleNextMonth();
    } else {
      handleNextWeek();
    }
  };

  // Handle day selection
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const dayItems = getItemsForDay(day);
    setSelectedItems(dayItems);
  };

  // Handle item status toggle
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
      setCards(cards.map(card => 
        card.id === item.id ? { ...card, completed: !item.completed } : card
      ));
      
      // Update selected items if necessary
      setSelectedItems(selectedItems.map(selectedItem => 
        selectedItem.id === item.id ? { ...selectedItem, completed: !item.completed } : selectedItem
      ));
      
      toast.success("Card status updated");
    } catch (err) {
      console.error("Error toggling item completion:", err);
      toast.error("Failed to update status");
    }
  };

  // Handle viewing card details
  const handleViewDetails = (item: CardItem) => {
    if (item.list?.board) {
      router.push(`/dashboard/${userId}/boards/${item.list.board.id}?cardId=${item.id}`);
    } else {
      toast.error("Could not locate the board for this card");
    }
  };

  // Drag and drop handlers
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
        setCards(cards.map(card => 
          card.id === cardId ? { ...card, dueDate: day.toISOString() } : card
        ));
        
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

  // Helper to get status styles
  const getStatusStyle = (status: string) => {
    return STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.default;
  };

  // Switch to today
  const handleGoToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
    
    // Get items for today
    const todayItems = getItemsForDay(new Date());
    setSelectedItems(todayItems);
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, idx) => (
          <Skeleton key={`header-${idx}`} className="h-10" />
        ))}
        
        {[...Array(35)].map((_, idx) => (
          <Skeleton key={`day-${idx}`} className="h-28" />
        ))}
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
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

  const renderCalendarView = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {viewMode === "month" 
              ? format(currentMonth, 'MMMM yyyy')
              : `Week of ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
            }
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrevious}
              aria-label={viewMode === "month" ? "Previous Month" : "Previous Week"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="mx-1"
              onClick={handleGoToToday}
            >
              Today
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNext}
              aria-label={viewMode === "month" ? "Next Month" : "Next Week"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="px-3">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Pick a date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentMonth}
                onSelect={(date) => date && setCurrentMonth(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Select
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "month" | "week")}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2",
                  statusFilter && "bg-primary/10 dark:bg-primary/20"
                )}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {statusFilter ? `Filter: ${getStatusStyle(statusFilter).label}` : "Filter"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px]" align="end">
              <div className="space-y-2">
                <div 
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => setStatusFilter(null)}
                >
                  <span>All statuses</span>
                  {!statusFilter && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                {Object.entries(STATUS_STYLES).filter(([key]) => key !== "default").map(([key, style]) => (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => setStatusFilter(key)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${style.bg}`} />
                      <span>{style.label}</span>
                    </div>
                    {statusFilter === key && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshCalendarData}
            disabled={isRefreshing}
            aria-label="Refresh calendar"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
          
          {statusFilter && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 px-2 h-8 text-xs bg-primary/10 dark:bg-primary/20" 
              onClick={() => setStatusFilter(null)}
            >
              Clear Filter
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : error ? (
        renderError()
      ) : (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted/30 rounded-md"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 auto-rows-fr">
            {daysInView.map((day, dayIndex) => {
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
                        <div
                          key={item.id}
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
                      );
                    })}
                    {dayItems.length > 4 && (
                      <div className="text-xs text-muted-foreground px-1 flex items-center gap-1 hover:text-primary">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                        </span>
                        <span className="pl-1">+{dayItems.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day details */}
          {selectedDay && (
            <Card className="mt-6">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                    {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                    {isToday(selectedDay) && (
                      <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                        Today
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setSelectedDay(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
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
                              <Badge 
                                className={cn(
                                  "text-xs h-5",
                                  statusStyle.bg,
                                  statusStyle.text
                                )}
                              >
                                {statusStyle.label}
                              </Badge>
                            </div>
                            {item.list && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.list.board?.title && `${item.list.board.title} • `}{item.list.title}
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

const renderBoardView = () => {
  if (!selectedBoard) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <Filter className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Board Selected</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          Select a board to view its tasks and lists in a board layout.
        </p>
      </div>
    );
  }

  if (!selectedBoard.lists || selectedBoard.lists.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CheckCircle2 className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">Board has no lists</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Add a list to start organizing tasks.
      </p>
    </div>
  );
}

  return (
    <div className="overflow-x-auto pb-4">
  <div className="flex space-x-4 py-2 min-w-max">
    {selectedBoard.lists.map((list) => (
      <div key={list.id} className="w-72 flex-shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {list.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {list.cards?.length} tasks
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.cards?.map((card: CardItem) => (
              <Card 
              key={card.id} 
              className="p-2 text-xs hover:bg-muted transition-colors"
              >
              {card.title}
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    ))}
  </div>
</div>
  );
};

  return (
    <div className="h-full space-y-4">
      <div className="flex justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your tasks and schedule in a calendar view.
          </p>
        </div>
        
        <Select
          value={selectedBoard?.id || "all"}
          onValueChange={handleBoardChange}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select a board" />
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
      </div>
      
      <Tabs 
        defaultValue="calendar" 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="focus-visible:outline-none focus-visible:ring-0">
          {renderCalendarView()}
        </TabsContent>
        
        <TabsContent value="board" className="focus-visible:outline-none focus-visible:ring-0">
          {renderBoardView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CalendarPage({ params }: { params: Promise<{ userId: string }> | { userId: string } }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CalendarPageContent params={params} />
    </Suspense>
  );
}
