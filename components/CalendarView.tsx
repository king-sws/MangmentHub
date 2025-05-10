"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { toast } from "sonner";

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

interface CalendarViewProps {
  userId: string;
  initialDate?: Date;
  boardId?: string | null;
}

export function CalendarView({ userId, initialDate = new Date(), boardId }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedItems, setSelectedItems] = useState<Card[]>([]);
  const [draggedItem, setDraggedItem] = useState<Card | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);

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
      if (boardId) {
        url += `&boardId=${boardId}`;
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
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentMonth, boardId]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
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
      window.location.href = `/dashboard/${userId}/boards/${item.list.board.id}?cardId=${item.id}`;
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

  return (
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
                        <StatusBadge status={item.status} />
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
}