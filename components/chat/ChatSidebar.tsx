// components/chat/ChatSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { ChatRoom } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Lock, Users, Search, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import CreateChatRoomDialog from "./CreateChatRoomDialog";
import { Badge } from "@/components/ui/badge";

interface ChatSidebarProps {
  workspaceId: string;
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isLoading: boolean;
  onRoomCreated?: (room: ChatRoom) => void;
}

type SortOption = "newest" | "alphabetical" | "mostActive";

export default function ChatSidebar({
  workspaceId,
  rooms,
  selectedRoomId,
  onSelectRoom,
  isLoading,
  onRoomCreated
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>(rooms);

  useEffect(() => {
    // Filter and sort rooms whenever rooms, searchQuery, or sortOption changes
    if (!rooms) return;

    let result = [...rooms];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(room => 
        (room.name?.toLowerCase().includes(query)) || 
        (room.description?.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    result = sortRooms(result, sortOption);
    
    setFilteredRooms(result);
  }, [rooms, searchQuery, sortOption]);

  const sortRooms = (roomsToSort: ChatRoom[], option: SortOption) => {
    switch (option) {
      case "alphabetical":
        return [...roomsToSort].sort((a, b) => 
          (a.name || "").localeCompare(b.name || "")
        );
      case "mostActive":
        return [...roomsToSort].sort((a, b) => 
          (b._count?.messages || 0) - (a._count?.messages || 0)
        );
      case "newest":
      default:
        return [...roomsToSort].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }
  };

  const handleCreateRoom = (newRoom: ChatRoom) => {
    setIsCreateDialogOpen(false);
    if (onRoomCreated) {
      onRoomCreated(newRoom);
    }
    // Auto-select the newly created room
    onSelectRoom(newRoom.id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <Skeleton className="h-9 w-full mb-2" />
        </div>
        <div className="p-2 border-b border-border">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-2">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Sort bar */}
      <div className="p-2 border-b border-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-2 top-2 text-muted-foreground" />
          <Input
            className="pl-8 py-1 h-8 text-sm"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOption("newest")}>
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("alphabetical")}>
              Alphabetical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("mostActive")}>
              Most active
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm p-4 text-center">
            {searchQuery ? (
              <>No rooms match your search</>
            ) : (
              <>
                No chat rooms available.{" "} 
                
              </>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <Button
              key={room.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1 p-3 h-auto overflow-hidden",
                selectedRoomId === room.id && "bg-accent"
              )}
              onClick={() => onSelectRoom(room.id)}
            >
              <div className="flex items-center w-full">
                <div className="mr-2 flex-shrink-0">
                  {room.isPrivate ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="truncate flex-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    {room.name || "Unnamed Room"}
                    {room.unreadCount > 0 && (
                      <Badge variant="default" className="h-5 text-xs">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {room.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {room.description}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{room._count?.members || 0}</span>
                    {(room._count?.messages ?? 0) > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{room._count?.messages ?? 0}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          ))
        )}
      </div>

      {/* Create Room Dialog */}
      <CreateChatRoomDialog
        workspaceId={workspaceId}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onRoomCreated={handleCreateRoom}
      />
    </div>
  );
}