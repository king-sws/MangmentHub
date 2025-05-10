"use client";

import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, AlertOctagon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SortableList } from "./SortableList";
import { SortableCard } from "./SortableCard";
import { CardDialog } from "./CardDialog";
import { ListDialog } from "./ListDialog";
import { CardStatus } from "@prisma/client";
import { DndWrapper } from "./DndWrapper";

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
  completed: boolean;
  status: CardStatus;
  assignees?: User[];
  createdAt: Date;
  updatedAt: Date | null;
}

interface List {
  id: string;
  title: string;
  boardId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date | null;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
  workspaceId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date | null;
  lists: List[];
}

interface BoardProps {
  initialBoard?: Board;
  workspaceId?: string;
}

export function Board({ initialBoard, workspaceId }: BoardProps) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null);
  const [lists, setLists] = useState<List[]>(initialBoard?.lists || []);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [creatingCardInList, setCreatingCardInList] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Load the board if not provided
  useEffect(() => {
    if (!initialBoard && workspaceId) {
      createNewBoard(workspaceId);
    }
  }, [initialBoard, workspaceId]);

  // Create a new board when needed
  const createNewBoard = async (wsId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "New Board",
          workspaceId: wsId
        })
      });
      
      if (!response.ok) throw new Error("Failed to create board");
      
      const newBoard = await response.json();
      setBoard(newBoard);
      
      // Create a default list for the new board
      const listResponse = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "To Do",
          boardId: newBoard.id
        })
      });
      
      if (listResponse.ok) {
        const newList = await listResponse.json();
        setLists([newList]);
      }
      
    } catch (err) {
      console.error("Error creating board:", err);
      setError("Failed to create a new board");
    } finally {
      setIsLoading(false);
    }
  };

  // Load the latest data from the server
  const refreshData = useCallback(async () => {
    if (!board?.id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/board/${board.id}`);
      if (!response.ok) {
        throw new Error("Failed to refresh board data");
      }
      const data = await response.json();
      setBoard(data);
      setLists(data.lists || []);
    } catch (err) {
      setError("Could not load the latest board data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [board?.id]);

  useEffect(() => {
    // Initialize lists from the board prop if available
    if (initialBoard) {
      setLists(initialBoard.lists || []);
    }
  }, [initialBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;

    if (activeType === "card") {
      const activeCardId = active.id.toString();
      const activeListId = active.data.current?.listId;
      
      // Find the card in the lists
      for (const list of lists) {
        if (list.id === activeListId) {
          const foundCard = list.cards.find(c => c.id === activeCardId);
          if (foundCard) {
            setActiveCard(foundCard);
            break;
          }
        }
      }
    } else if (activeType === "list") {
      const activeListId = active.id.toString();
      const foundList = lists.find(l => l.id === activeListId);
      if (foundList) {
        setActiveList(foundList);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    if (activeId === overId) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Handle card over another card or list
    if (activeType === "card") {
      // Get the source list id
      const activeListId = active.data.current?.listId;
      
      // When dragging over another card
      if (overType === "card") {
        const overListId = over.data.current?.listId;
        
        // If within the same list, reorder
        if (activeListId === overListId) {
          setLists(prevLists => {
            return prevLists.map(list => {
              if (list.id !== overListId) return list;
              
              const oldIndex = list.cards.findIndex(card => card.id === activeId);
              const newIndex = list.cards.findIndex(card => card.id === overId);
              
              const newCards = arrayMove(list.cards, oldIndex, newIndex);
              
              return {
                ...list,
                cards: newCards.map((card, i) => ({ ...card, order: i }))
              };
            });
          });
        } 
        // If to a different list, move card
        else {
          setLists(prevLists => {
            // Remove from source list
            const sourceList = prevLists.find(l => l.id === activeListId);
            const destinationList = prevLists.find(l => l.id === overListId);
            
            if (!sourceList || !destinationList) return prevLists;
            
            const cardToMove = sourceList.cards.find(c => c.id === activeId);
            if (!cardToMove) return prevLists;
            
            // Get new cards for source list
            const newSourceCards = sourceList.cards
              .filter(card => card.id !== activeId)
              .map((card, i) => ({ ...card, order: i }));
            
            // Get index where to insert in destination list
            const overIndex = destinationList.cards.findIndex(c => c.id === overId);
            
            // Prepare card for move with new listId
            const updatedCard = { 
              ...cardToMove, 
              listId: overListId,
              order: 0 // Will be adjusted in the map below
            };
            
            // Insert card at correct position
            const newDestCards = [...destinationList.cards];
            newDestCards.splice(overIndex, 0, updatedCard);
            
            // Update order for all cards in destination
            const updatedDestCards = newDestCards.map((card, i) => ({ ...card, order: i }));
            
            return prevLists.map(list => {
              if (list.id === activeListId) {
                return { ...list, cards: newSourceCards };
              }
              if (list.id === overListId) {
                return { ...list, cards: updatedDestCards };
              }
              return list;
            });
          });
        }
      }
      
      // When dragging over a list (direct drop onto list)
      else if (overType === "list") {
        const overListId = overId;
        
        // If different list, move the card to the end of that list
        if (activeListId !== overListId) {
          setLists(prevLists => {
            // Remove from source list
            const sourceList = prevLists.find(l => l.id === activeListId);
            const destinationList = prevLists.find(l => l.id === overListId);
            
            if (!sourceList || !destinationList) return prevLists;
            
            const cardToMove = sourceList.cards.find(c => c.id === activeId);
            if (!cardToMove) return prevLists;
            
            // Get new cards for source list
            const newSourceCards = sourceList.cards
              .filter(card => card.id !== activeId)
              .map((card, i) => ({ ...card, order: i }));
            
            // Prepare card for move with new listId
            const updatedCard = { 
              ...cardToMove, 
              listId: overListId,
              order: destinationList.cards.length
            };
            
            // Add card to the end of destination list
            const newDestCards = [...destinationList.cards, updatedCard]
              .map((card, i) => ({ ...card, order: i }));
            
            return prevLists.map(list => {
              if (list.id === activeListId) {
                return { ...list, cards: newSourceCards };
              }
              if (list.id === overListId) {
                return { ...list, cards: newDestCards };
              }
              return list;
            });
          });
        }
      }
    }
    
    // Handle list over another list
    else if (activeType === "list" && overType === "list") {
      setLists(prevLists => {
        const oldIndex = prevLists.findIndex(list => list.id === activeId);
        const newIndex = prevLists.findIndex(list => list.id === overId);
        
        const newLists = arrayMove(prevLists, oldIndex, newIndex);
        
        return newLists.map((list, i) => ({ ...list, order: i }));
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;
    
    if (activeType === "card" && activeCard) {
      const updatedCard = lists
        .flatMap(list => list.cards)
        .find(card => card.id === activeCard.id);
      
      if (updatedCard && (updatedCard.listId !== activeCard.listId || updatedCard.order !== activeCard.order)) {
        // Optimistically update UI
        toast.success("Card moved successfully");
        
        try {
          // Save changes to server
          const response = await fetch('/api/cards/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activeId: activeCard.id,
              overId: event.over?.id.toString(),
              newListId: updatedCard.listId,
            })
          });
          
          if (!response.ok) {
            throw new Error("Failed to update card position");
          }
        } catch (err) {
          console.error("Error updating card position:", err);
          toast.error("Failed to save card position");
          // Could revert changes by calling refreshData()
        }
      }
    } else if (activeType === "list" && activeList) {
      // Similar logic for list reordering
      try {
        await fetch(`/api/lists/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listIds: lists.map(list => list.id) 
          })
        });
        toast.success("List order updated");
      } catch (err) {
        console.error("Error updating list order:", err);
        toast.error("Failed to save list order");
      }
    }
    
    // Reset active items
    setActiveCard(null);
    setActiveList(null);
  };

  const handleAddCard = async (listId: string) => {
    setCreatingCardInList(listId);
    setIsCreatingCard(true);
    setCurrentCard(null);
    setIsCardDialogOpen(true);
  };

  const handleEditCard = (card: Card) => {
    setCurrentCard(card);
    setIsCreatingCard(false);
    setIsCardDialogOpen(true);
  };

  const handleSaveCard = async (cardData: Partial<Card>) => {
    try {
      setIsLoading(true);
      
      if (isCreatingCard) {
        // Create new card
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...cardData,
            listId: creatingCardInList
          })
        });
        
        if (!response.ok) throw new Error("Failed to create card");
        
        toast.success("Card created successfully");
      } else if (currentCard) {
        // Update existing card
        const response = await fetch(`/api/cards/${currentCard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData)
        });
        
        if (!response.ok) throw new Error("Failed to update card");
        
        toast.success("Card updated successfully");
      }
      
      // Refresh data after card operation
      await refreshData();
      
      // Close dialog
      setIsCardDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error("Failed to delete card");
      
      // Optimistic update UI
      setLists(prevLists => 
        prevLists.map(list => ({
          ...list,
          cards: list.cards.filter(c => c.id !== cardId)
        }))
      );
      
      toast.success("Card deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete card");
      // Refresh to ensure UI is in sync with server
      await refreshData();
    }
  };

  const handleToggleCardComplete = async (card: Card) => {
    try {
      // Optimistic update
      setLists(prevLists => 
        prevLists.map(list => ({
          ...list,
          cards: list.cards.map(c => c.id === card.id ? { ...c, completed: !c.completed } : c)
        }))
      );
      
      // Send update to server
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !card.completed })
      });
      
      if (!response.ok) throw new Error("Failed to update card status");
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to update card status");
      // Revert optimistic update
      await refreshData();
    }
  };

  const handleAddList = () => {
    setIsListDialogOpen(true);
  };

  const handleSaveList = async (title: string) => {
    if (!board?.id) {
      toast.error("No active board found");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          boardId: board.id
        })
      });
      
      if (!response.ok) throw new Error("Failed to create list");
      
      // Refresh data after list creation
      await refreshData();
      
      toast.success("List created successfully");
      setIsListDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error("Failed to delete list");
      
      // Optimistic update
      setLists(prevLists => prevLists.filter(list => list.id !== listId));
      
      toast.success("List deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete list");
      // Refresh to ensure UI is in sync with server
      await refreshData();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertOctagon className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-medium text-red-500">Error Loading Board</h3>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button 
          onClick={refreshData} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <DndWrapper>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">{board?.title || "Loading board..."}</h1>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {lists.map((list) => (
              <SortableList
                key={list.id}
                id={list.id}
                listId={list.id}
                title={list.title}
                onAddCard={() => handleAddCard(list.id)}
                onDeleteList={() => handleDeleteList(list.id)}
              >
                {list.cards?.map((card) => (
                  <SortableCard
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    listId={card.listId}
                    card={card}
                    onDelete={() => handleDeleteCard(card.id)}
                    onEdit={() => handleEditCard(card)}
                    onToggleComplete={() => handleToggleCardComplete(card)}
                  />
                ))}
              </SortableList>
            ))}
            
            <div className="flex-shrink-0 w-72">
              <Button 
                onClick={handleAddList}
                variant="outline"
                className="h-12 w-full flex items-center justify-center border-dashed border-2"
              >
                <Plus size={16} className="mr-2" />
                Add List
              </Button>
            </div>
          </div>
        </DndContext>

        {isCardDialogOpen && (
          <CardDialog
            isOpen={isCardDialogOpen}
            onClose={() => setIsCardDialogOpen(false)}
            onSave={handleSaveCard}
            card={currentCard}
            isCreating={isCreatingCard}
            isLoading={isLoading}
          />
        )}

        {isListDialogOpen && (
          <ListDialog
            isOpen={isListDialogOpen}
            onClose={() => setIsListDialogOpen(false)}
            onSave={handleSaveList}
            isLoading={isLoading}
          />
        )}
      </div>
    </DndWrapper>
  );
}