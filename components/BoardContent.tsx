/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, AlertOctagon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SortableList, SortableListProps } from "./SortableList";
import { SortableCard } from "./SortableCard";
import { CardDialog } from "./CardDialog";
import { ListDialog } from "./ListDialog";
import { CardStatus } from "@prisma/client";

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

interface BoardContentProps {
  board: Board;
}

export function BoardContent({ board }: BoardContentProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [creatingCardInList, setCreatingCardInList] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<Board>(board);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const refreshInProgress = useRef(false);
  const [listOperationLoading, setListOperationLoading] = useState<Record<string, boolean>>({});

  // Load the latest data from the server

const refreshData = useCallback(async () => {
  // Prevent multiple simultaneous refresh calls
  if (refreshInProgress.current) {
    console.log("Refresh already in progress, skipping...");
    return;
  }
  
  try {
    refreshInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    console.log("Refreshing board data for ID:", board.id);
    const response = await fetch(`/api/board/${board.id}/full`);
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error(`Failed to refresh board data: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("API response data structure:", {
      hasLists: !!data.lists,
      listsCount: data.lists?.length || 0,
      title: data.title
    });
    
    if (data && data.lists) {
      // Sort lists by order
      const sortedLists = [...data.lists].sort((a, b) => a.order - b.order);
      
      // Sort cards within each list by order
      sortedLists.forEach(list => {
        if (list.cards) {
          list.cards.sort((a: Card, b: Card) => a.order - b.order);
        } else {
          list.cards = [];
        }
      });
      
      // Only update state if data has actually changed
      setLists(prevLists => {
        const hasChanged = JSON.stringify(prevLists) !== JSON.stringify(sortedLists);
        return hasChanged ? sortedLists : prevLists;
      });
    } else {
      setLists([]);
      console.warn("No lists data found in the response", data);
    }
  } catch (err) {
    console.error("Error refreshing data:", err);
    setError(err instanceof Error ? err.message : "Could not load the latest board data. Please try again.");
  } finally {
    setIsLoading(false);
    refreshInProgress.current = false;
  }
}, [board.id]); // Only depend on board.id


  useEffect(() => {
    // Initialize with data from props
    if (board.lists) {
      const sortedLists = [...board.lists].sort((a, b) => a.order - b.order);
      sortedLists.forEach(list => {
        if (list.cards) {
          list.cards.sort((a, b) => a.order - b.order);
        } else {
          list.cards = [];
        }
      });
      setLists(sortedLists);
    }
    
    // Then fetch fresh data
    refreshData();
  }, [board, refreshData]);

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
              
              if (oldIndex === -1 || newIndex === -1) return list;
              
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
            
            if (overIndex === -1) return prevLists;
            
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
        
        if (oldIndex === -1 || newIndex === -1) return prevLists;
        
        const newLists = arrayMove(prevLists, oldIndex, newIndex);
        
        return newLists.map((list, i) => ({ ...list, order: i }));
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeType = active.data.current?.type;
    
    if (activeType === "card" && activeCard) {
      const updatedCard = lists
        .flatMap(list => list.cards)
        .find(card => card.id === activeCard.id);
      
      if (updatedCard && (updatedCard.listId !== activeCard.listId || updatedCard.order !== activeCard.order)) {
        // Optimistically update UI - already done in handleDragOver
        try {
          // Save changes to server
          const response = await fetch('/api/cards/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cardId: activeCard.id,
              newListId: updatedCard.listId,
              newOrder: updatedCard.order,
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update card position: ${response.status}`);
          }
          
          toast.success("Card moved successfully");
        } catch (err) {
          console.error("Error updating card position:", err);
          toast.error("Failed to save card position");
          // Refresh to ensure UI is in sync with server
          await refreshData();
        }
      }
    } else if (activeType === "list" && activeList) {
      try {
        const updatedLists = lists.map((list, index) => ({
          id: list.id,
          order: index
        }));
        
        const response = await fetch('/api/lists/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lists: updatedLists })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update list order: ${response.status}`);
        }
        
        toast.success("List order updated");
      } catch (err) {
        console.error("Error updating list order:", err);
        toast.error("Failed to save list order");
        // Refresh to ensure UI is in sync with server
        await refreshData();
      }
    }
    
    // Reset active items
    setActiveCard(null);
    setActiveList(null);
  };

  // Add these state variables
  const [editingList, setEditingList] = useState<List | null>(null);
  const memoizedLists = useMemo(() => lists, [lists]);
  const MemoizedSortableCard = memo(SortableCard);

  interface MemoizedSortableListProps extends SortableListProps {
  cards: Card[];
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onToggleCardComplete: (card: Card) => void;
}


  
  


// Edit List handler
const handleEditList = useCallback(async (listId: string, listTitle: string) => {
  setEditingList({ id: listId, title: listTitle } as List);
  await refreshData();
  setIsListDialogOpen(true);
}, []);

// const handleEditList = async (listId: string, newTitle: string) => {
//   try {
//     const response = await fetch(`/api/lists/${listId}`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ title: newTitle })
//     });
    
//     if (response.ok) {
//       const updatedList = await response.json();
//       toast.success("List updated successfully");
      
//       // Make sure to refresh your data here
//       await refreshData(); // or however you refresh your lists
      
//       // Or update the local state directly
//       setLists(prevLists => 
//         prevLists.map(list => 
//           list.id === listId ? { ...list, title: newTitle } : list
//         )
//       );
//     } else {
//       const error = await response.json();
//       toast.error(error.message || "Failed to update list");
//     }
//   } catch (err) {
//     console.error("Edit list error:", err);
//     toast.error("Failed to update list");
//   }
// };

// Duplicate List handler 
const handleDuplicateList = async (listId: string) => {
  try {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    
    const response = await fetch('/api/lists/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId })
    });
    
    if (response.ok) {
      toast.success("List duplicated successfully");
      await refreshData();
    }
  } catch (err) {
    toast.error("Failed to duplicate list");
  }
};

// Archive List handler (simplified example)
const handleArchiveList = async (listId: string) => {
  try {
    const response = await fetch(`/api/lists/${listId}/archive`, {
      method: 'PATCH'
    });
    
    if (response.ok) {
      toast.success("List archived successfully");
      await refreshData();
    }
  } catch (err) {
    toast.error("Failed to archive list");
  }
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
        const payload = {
          ...cardData,
          listId: creatingCardInList,
          order: lists.find(list => list.id === creatingCardInList)?.cards.length || 0
        };
        
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Failed to create card: ${response.status} ${errorData ? JSON.stringify(errorData) : ''}`);
        }
        
        const newCard = await response.json();
        
        // Update local state immediately
        setLists(prevLists => {
          return prevLists.map(list => {
            if (list.id === creatingCardInList) {
              return {
                ...list,
                cards: [...list.cards, newCard]
              };
            }
            return list;
          });
        });
        
        toast.success("Card created successfully");
      } else if (currentCard) {
        // Update existing card
        const response = await fetch(`/api/cards/${currentCard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Failed to update card: ${response.status} ${errorData ? JSON.stringify(errorData) : ''}`);
        }
        
        const updatedCard = await response.json();
        
        // Update local state immediately
        setLists(prevLists => {
          return prevLists.map(list => {
            if (list.id === updatedCard.listId) {
              return {
                ...list,
                cards: list.cards.map(c => 
                  c.id === updatedCard.id ? updatedCard : c
                )
              };
            }
            return list;
          });
        });
        
        toast.success("Card updated successfully");
      }
      
      // Close dialog
      setIsCardDialogOpen(false);
    } catch (err) {
      console.error("Card save error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong saving the card");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      // Find which list contains this card
      let cardListId: string | null = null;
      for (const list of lists) {
        const card = list.cards.find(c => c.id === cardId);
        if (card) {
          cardListId = list.id;
          break;
        }
      }
      
      if (!cardListId) {
        throw new Error("Card not found");
      }
      
      // Optimistic update UI
      setLists(prevLists => 
        prevLists.map(list => {
          if (list.id === cardListId) {
            return {
              ...list,
              cards: list.cards
                .filter(c => c.id !== cardId)
                .map((card, index) => ({ ...card, order: index }))
            };
          }
          return list;
        })
      );
      
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete card: ${response.status}`);
      }
      
      toast.success("Card deleted successfully");
    } catch (err) {
      console.error("Error deleting card:", err);
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
          cards: list.cards.map(c => 
            c.id === card.id ? { ...c, completed: !c.completed } : c
          )
        }))
      );
      
      // Send update to server
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !card.completed })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update card status: ${response.status}`);
      }
      
    } catch (err) {
      console.error("Error toggling card completion:", err);
      toast.error("Failed to update card status");
      // Revert optimistic update
      await refreshData();
    }
  };

  const handleAddList = () => {
    setIsListDialogOpen(true);
  };

// Replace your current handleSaveList function with this fixed version:

const handleSaveList = useCallback(async (title: string) => {
  // Prevent multiple simultaneous saves
  if (isLoading) {
    console.log("Save already in progress, skipping...");
    return;
  }

  try {
    setIsLoading(true);
    
    if (editingList) {
      // Update existing list
      const response = await fetch(`/api/lists/${editingList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Failed to update list: ${response.status} ${errorData ? JSON.stringify(errorData) : ''}`);
      }
      
      // Update local state immediately - more defensive approach
      setLists(prevLists => {
        return prevLists.map(list => 
          list.id === editingList.id ? { ...list, title } : list
        );
      });
      
      toast.success("List updated successfully");
    } else {
      // Create new list
      const payload = {
        title,
        boardId: board.id,
        order: lists.length // Capture current length
      };
      
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Failed to create list: ${response.status} ${errorData ? JSON.stringify(errorData) : ''}`);
      }
      
      const newList = await response.json();
      
      // Add cards array to prevent errors
      newList.cards = [];
      
      // Update local state immediately
      setLists(prevLists => [...prevLists, newList]);
      
      toast.success("List created successfully");
    }
    
    // Close dialog and reset state
    setIsListDialogOpen(false);
    setEditingList(null);
    
  } catch (err) {
    console.error("List save error:", err);
    toast.error(err instanceof Error ? err.message : "Failed to save list");
  } finally {
    setIsLoading(false);
  }
}, [editingList, board.id, isLoading]); // Remove lists.length dependency // Proper dependencies

  const handleDeleteList = async (listId: string) => {
    try {
      // Optimistic update
      setLists(prevLists => {
        const filteredLists = prevLists.filter(list => list.id !== listId);
        // Update order of remaining lists
        return filteredLists.map((list, index) => ({ ...list, order: index }));
      });
      
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete list: ${response.status}`);
      }
      
      toast.success("List deleted successfully");
    } catch (err) {
      console.error("Error deleting list:", err);
      toast.error("Failed to delete list");
      // Refresh to ensure UI is in sync with server
      await refreshData();
    }
  };

  // Show loading indicator
  if (isLoading && lists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">{board.title}</h1>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {memoizedLists.map((list) => (
            <SortableList
              key={list.id}
              id={list.id}
              listId={list.id}
              title={list.title}
              onAddCard={() => handleAddCard(list.id)}
              onDeleteList={() => handleDeleteList(list.id)}
              onEditList={() => handleEditList(list.id, list.title)}
              // Add these missing actions:
              onDuplicateList={() => handleDuplicateList(list.id)}
              // onArchiveList={() => handleArchiveList(list.id)}
              // Pass task count for progress indicator
              taskCount={list.cards.length}
              completedCount={list.cards.filter(c => c.completed).length}
            >
              {list.cards && list.cards.length > 0 ? (
                list.cards.map((card) => (
                  <MemoizedSortableCard
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    listId={card.listId}
                    card={card}
                    onDelete={() => handleDeleteCard(card.id)}
                    onEdit={() => handleEditCard(card)}
                    onToggleComplete={() => handleToggleCardComplete(card)}
                  />
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500 italic">
                  No cards yet
                </div>
              )}
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
    onClose={() => {
      setIsListDialogOpen(false);
      setEditingList(null);
    }}
    onSave={handleSaveList}
    isLoading={isLoading}
    initialTitle={editingList?.title} // Pass current title
  />
)}
    </div>
  );
}