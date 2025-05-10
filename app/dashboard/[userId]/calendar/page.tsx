/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react"; // Import use from React
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardContent } from "@/components/BoardContent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Board {
  id: string;
  title: string;
  workspaceId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date | null;
  lists: any[];
}

interface Card {
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
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedItems, setSelectedItems] = useState<Card[]>([]);
  const [draggedItem, setDraggedItem] = useState<Card | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");

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
      setSelectedBoard(boardData);
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
      const processedCards = cardsData.map((card: Card) => ({
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

  // Get days for the current month view (including padding days)
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth);
  const endDate = endOfWeek(lastDayOfMonth);
  const daysInMonthView = eachDayOfInterval({ start: startDate, end: endDate });

  // Find items for a specific day
  const getItemsForDay = (day: Date) => {
    return cards.filter(item => {
      if (!item.dueDate) return false;
      const itemDate = new Date(item.dueDate);
      return isSameDay(day, itemDate);
    });
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Handle day selection
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const dayItems = getItemsForDay(day);
    setSelectedItems(dayItems);
  };

  // Handle item status toggle
  const handleToggleComplete = async (item: Card) => {
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
  const handleViewDetails = (item: Card) => {
    if (item.list?.board) {
      router.push(`/dashboard/${userId}/boards/${item.list.board.id}?cardId=${item.id}`);
    } else {
      toast.error("Could not locate the board for this card");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: Card) => {
    e.dataTransfer.setData('cardId', item.id);
    setDraggedItem(item);
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
        if (selectedDay && isSameDay(selectedDay, draggedItem.dueDate ? new Date(draggedItem.dueDate) : new Date())) {
          setSelectedItems(prev => prev.filter(item => item.id !== cardId));
        }
        
        if (selectedDay && isSameDay(selectedDay, day)) {
          const updatedCard = { ...draggedItem, dueDate: day.toISOString() };
          setSelectedItems(prev => [...prev, updatedCard]);
        }
        
        toast.success("Card moved successfully");
      } else {
        toast.error(result[0]?.error || "Failed to move card");
      }
    } catch (err) {
      console.error("Error updating card due date:", err);
      toast.error("Failed to move card");
    } finally {
      setDraggedItem(null);
    }
  };

  const renderCalendarView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Calendar</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <span>{format(currentMonth, 'MMMM yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentMonth}
                onSelect={(date) => date && setCurrentMonth(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          <p>{error}</p>
          <Button onClick={fetchCalendarData} className="mt-2" variant="outline">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonthView.map((day, dayIndex) => {
            const dayItems = getItemsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const isDragOver = dragOverDay ? isSameDay(day, dragOverDay) : false;
            
            return (
              <div
                key={dayIndex}
                className={cn(
                  "min-h-28 p-1 border border-muted rounded-md overflow-hidden cursor-pointer",
                  isToday && "bg-muted/20",
                  isSelected && "ring-2 ring-primary",
                  isDragOver && "ring-2 ring-blue-400 bg-blue-50",
                  !isSameMonth(day, currentMonth) && "opacity-50 bg-muted/10"
                )}
                onClick={() => handleDayClick(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-1.5">
                      {dayItems.length}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                  {dayItems.slice(0, 3).map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className={cn(
                        "text-xs p-1 rounded-sm truncate cursor-grab",
                        item.completed ? "bg-muted line-through text-muted-foreground" : "bg-primary/10"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      + {dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected day details */}
      {selectedDay && (
        <div className="mt-6 border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2">
            {format(selectedDay, 'MMMM d, yyyy')}
          </h3>
          
          {selectedItems.length === 0 ? (
            <p className="text-muted-foreground">No items scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleComplete(item)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <p className={cn(
                        "font-medium",
                        item.completed && "line-through text-muted-foreground"
                      )}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          item.status === "todo" && "bg-gray-100 text-gray-800",
                          item.status === "in_progress" && "bg-blue-100 text-blue-800",
                          item.status === "done" && "bg-green-100 text-green-800",
                          item.status === "canceled" && "bg-red-100 text-red-800"
                        )}>
                          {item.status === "todo" && "To Do"}
                          {item.status === "in_progress" && "In Progress"}
                          {item.status === "done" && "Done"}
                          {item.status === "canceled" && "Canceled"}
                          {!["todo", "in_progress", "done", "canceled"].includes(item.status) && item.status}
                        </span>
                        {item.list?.board && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {item.list.board.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleComplete(item)}>
                        Mark as {item.completed ? 'incomplete' : 'complete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Workspace Calendar</h1>
        
        <div className="flex items-center gap-2">
          <Select
            value={selectedBoard?.id || "all"}
            onValueChange={handleBoardChange}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by board" />
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
          
          {selectedBoard && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedBoard(null);
                router.push(`/dashboard/${userId}/calendar`);
              }}
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>
     
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          {selectedBoard && <TabsTrigger value="board">Board View</TabsTrigger>}
        </TabsList>
       
        <TabsContent value="calendar" className="space-y-6">
          {renderCalendarView()}
        </TabsContent>
       
        {selectedBoard && (
          <TabsContent value="board">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <BoardContent board={selectedBoard} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}