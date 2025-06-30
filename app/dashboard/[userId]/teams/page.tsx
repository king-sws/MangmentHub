/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useReducer, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatRoom from "@/components/chat/ChatRoom";
import { ChatRoom as ChatRoomType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { PlusIcon, MenuIcon, XIcon, ChevronDownIcon } from "lucide-react";
import CreateChatRoomDialog from "@/components/chat/CreateChatRoomDialog";
import { getWorkspaces } from "@/actions/workspace";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define the state interface
interface ChatPageState {
  workspaces: any[];
  selectedWorkspaceId: string | null;
  chatRooms: ChatRoomType[];
  selectedRoomId: string | null;
  isCreateDialogOpen: boolean;
  isLoading: boolean;
  loadingWorkspaces: boolean;
  error: string | null;
}

// Define action types
type ChatPageAction =
  | { type: 'SET_WORKSPACES', payload: any[] }
  | { type: 'SET_SELECTED_WORKSPACE', payload: string }
  | { type: 'SET_CHAT_ROOMS', payload: ChatRoomType[] }
  | { type: 'SET_SELECTED_ROOM', payload: string | null }
  | { type: 'SET_CREATE_DIALOG', payload: boolean }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_LOADING_WORKSPACES', payload: boolean }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'ADD_CHAT_ROOM', payload: ChatRoomType }
  | { type: 'CLEAR_CHAT_ROOMS' }
  | { type: 'UPDATE_CHAT_ROOM', payload: ChatRoomType }
  | { type: 'REMOVE_CHAT_ROOM', payload: string };

// Initial state
const initialState: ChatPageState = {
  workspaces: [],
  selectedWorkspaceId: null,
  chatRooms: [],
  selectedRoomId: null,
  isCreateDialogOpen: false,
  isLoading: false,
  loadingWorkspaces: true,
  error: null
};

// Reducer function
function reducer(state: ChatPageState, action: ChatPageAction): ChatPageState {
  switch (action.type) {
    case 'SET_WORKSPACES':
      return { ...state, workspaces: action.payload };
    case 'SET_SELECTED_WORKSPACE':
      return { ...state, selectedWorkspaceId: action.payload };
    case 'SET_CHAT_ROOMS':
      return { ...state, chatRooms: action.payload };
    case 'SET_SELECTED_ROOM':
      return { ...state, selectedRoomId: action.payload };
    case 'SET_CREATE_DIALOG':
      return { ...state, isCreateDialogOpen: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADING_WORKSPACES':
      return { ...state, loadingWorkspaces: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_CHAT_ROOM':
      return { ...state, chatRooms: [action.payload, ...state.chatRooms] };
    case 'UPDATE_CHAT_ROOM':
      return {
        ...state,
        chatRooms: state.chatRooms.map(room =>
          room.id === action.payload.id ? action.payload : room
        )
      };
    case 'REMOVE_CHAT_ROOM':
      return {
        ...state,
        chatRooms: state.chatRooms.filter(room => room.id !== action.payload),
        selectedRoomId: state.selectedRoomId === action.payload ? null : state.selectedRoomId
      };
    case 'CLEAR_CHAT_ROOMS':
      return { ...state, chatRooms: [], selectedRoomId: null };
    default:
      return state;
  }
}

export default function ChatPage() {
  const params = useParams();
  const userId = params && params.userId
    ? Array.isArray(params.userId)
      ? params.userId[0]
      : params.userId
    : null;
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  
  const {
    workspaces,
    selectedWorkspaceId,
    chatRooms,
    selectedRoomId,
    isCreateDialogOpen,
    isLoading,
    loadingWorkspaces,
    error
  } = state;

  // Get selected workspace name for mobile display
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  // Auto-close sidebar when room is selected on mobile
  const handleRoomSelect = useCallback((roomId: string) => {
    dispatch({ type: 'SET_SELECTED_ROOM', payload: roomId });
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  }, []);

  const handleWorkspaceChange = useCallback((workspaceId: string) => {
    dispatch({ type: 'SET_SELECTED_WORKSPACE', payload: workspaceId });
    dispatch({ type: 'CLEAR_CHAT_ROOMS' });
    setIsWorkspaceDropdownOpen(false);
  }, []);

  const handleRoomCreated = useCallback((newRoom: ChatRoomType) => {
    dispatch({ type: 'ADD_CHAT_ROOM', payload: newRoom });
    dispatch({ type: 'SET_SELECTED_ROOM', payload: newRoom.id });
    dispatch({ type: 'SET_CREATE_DIALOG', payload: false });
    setIsSidebarOpen(false); // Close sidebar on mobile after creation
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Fetch workspaces with improved error handling
  const loadWorkspaces = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_WORKSPACES', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const userWorkspaces = await getWorkspaces();
      dispatch({ type: 'SET_WORKSPACES', payload: userWorkspaces });
      
      // Select the first workspace by default
      if (userWorkspaces.length > 0 && !selectedWorkspaceId) {
        dispatch({ type: 'SET_SELECTED_WORKSPACE', payload: userWorkspaces[0].id });
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load workspaces. Please try again.";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error("Failed to load workspaces. Please try again.");
    } finally {
      dispatch({ type: 'SET_LOADING_WORKSPACES', payload: false });
    }
  }, [selectedWorkspaceId]);

  // Fetch workspaces (only when userId changes)
  useEffect(() => {
    if (userId) {
      loadWorkspaces();
    }
  }, [userId, loadWorkspaces]);

  // Fetch chat rooms with improved error handling
  const fetchChatRooms = useCallback(async (workspaceId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'SET_CHAT_ROOMS', payload: data });
        
        // Select the first room by default if available and no room is selected
        if (data.length > 0 && !selectedRoomId) {
          dispatch({ type: 'SET_SELECTED_ROOM', payload: data[0].id });
        }
      } else {
        const errorText = `Failed to fetch chat rooms: ${res.status} ${res.statusText}`;
        console.error(errorText);
        dispatch({ type: 'SET_ERROR', payload: errorText });
        dispatch({ type: 'SET_CHAT_ROOMS', payload: [] });
        dispatch({ type: 'SET_SELECTED_ROOM', payload: null });
        
        toast.error("Failed to load chat rooms. Please try again.");
      }
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load chat rooms. Please try again.";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CHAT_ROOMS', payload: [] });
      dispatch({ type: 'SET_SELECTED_ROOM', payload: null });
      
      toast.error("Failed to load chat rooms. Please try again.");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [selectedRoomId]);

  // Fetch chat rooms when selected workspace changes
  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchChatRooms(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, fetchChatRooms]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('chat-sidebar');
        const target = event.target as Node;
        if (sidebar && !sidebar.contains(target)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
      
      // Close sidebar with Escape
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Workspace selector */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <button
            className="w-full p-2 rounded border border-border bg-background text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            disabled={loadingWorkspaces}
          >
            <span className="truncate">
              {loadingWorkspaces 
                ? "Loading workspaces..." 
                : selectedWorkspace?.name || "Select workspace"
              }
            </span>
            <ChevronDownIcon className={cn(
              "h-4 w-4 transition-transform",
              isWorkspaceDropdownOpen && "transform rotate-180"
            )} />
          </button>
          
          {isWorkspaceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-40 max-h-60 overflow-y-auto">
              {workspaces.length > 0 ? (
                workspaces.map(workspace => (
                  <button
                    key={workspace.id}
                    className={cn(
                      "w-full p-2 text-left hover:bg-muted/50 transition-colors",
                      selectedWorkspaceId === workspace.id && "bg-muted"
                    )}
                    onClick={() => handleWorkspaceChange(workspace.id)}
                  >
                    {workspace.name}
                  </button>
                ))
              ) : (
                <div className="p-2 text-muted-foreground">No workspaces found</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Chat rooms header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-semibold text-lg">Chat Rooms</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch({ type: 'SET_CREATE_DIALOG', payload: true })}
          disabled={!selectedWorkspaceId}
          className="shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Chat rooms list */}
      <div className="flex-1 overflow-hidden">
        <ChatSidebar
          workspaceId={selectedWorkspaceId || ""}
          rooms={chatRooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleRoomSelect}
          isLoading={isLoading}
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        id="chat-sidebar"
        className={cn(
          "w-64 h-full transition-transform duration-300 ease-in-out z-30",
          "md:relative md:translate-x-0",
          "fixed left-0 top-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Mobile header */}
        <div className="md:hidden p-4 border-b border-border flex items-center justify-between bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="shrink-0"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="font-semibold truncate">
              {selectedRoomId 
                ? chatRooms.find(room => room.id === selectedRoomId)?.name || "Chat Room"
                : selectedWorkspace?.name || "Chat"
              }
            </h1>
          </div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        {/* Error banner */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissError}
              className="text-destructive hover:text-destructive/80 p-1 h-auto"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          {selectedRoomId && selectedWorkspaceId ? (
            <ChatRoom
              workspaceId={selectedWorkspaceId}
              roomId={selectedRoomId}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4 p-4">
              {!selectedWorkspaceId ? (
                <div className="text-center">
                  <p className="mb-2">Please select a workspace first</p>
                  <Button 
                    variant="outline"
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden"
                  >
                    Open Workspace Selector
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="mb-4">Select a chat room or create a new one to start chatting</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={() => dispatch({ type: 'SET_CREATE_DIALOG', payload: true })}
                      disabled={!selectedWorkspaceId}
                    >
                      Create Chat Room
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsSidebarOpen(true)}
                      className="md:hidden"
                    >
                      Browse Rooms
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create chat room dialog */}
      {selectedWorkspaceId && (
        <CreateChatRoomDialog
          workspaceId={selectedWorkspaceId}
          isOpen={isCreateDialogOpen}
          onClose={() => dispatch({ type: 'SET_CREATE_DIALOG', payload: false })}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}