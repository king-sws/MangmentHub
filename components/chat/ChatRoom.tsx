/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { ChatMessage as ChatMessageType, ChatRoom as ChatRoomType } from "@/types/chat";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface ChatRoomProps {
  workspaceId: string;
  roomId: string;
}

interface ConnectionStatus {
  isOnline: boolean;
  isSocketConnected: boolean;
  lastConnectionTime: number | null;
  reconnectAttempts: number;
}

interface ChatRoomState {
  room: ChatRoomType | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000;
const CONNECTION_CHECK_INTERVAL = 5000;
const SCROLL_THRESHOLD = 100;

export default function ChatRoom({ workspaceId, roomId }: ChatRoomProps) {
  // ✅ Move useAuth hook call to the top level of the component
  const { user } = useAuth();
  
  // Memoized room identifier for socket connections
  const combinedRoomId = useMemo(() => `${workspaceId}:${roomId}`, [workspaceId, roomId]);
  
  // Core state management
  const [roomState, setRoomState] = useState<ChatRoomState>({
    room: null,
    isLoading: true,
    error: null,
    retryCount: 0
  });
  
  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSocketConnected: false,
    lastConnectionTime: null,
    reconnectAttempts: 0
  });
  
  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);

  // Chat hook for real-time functionality
  const {
    messages: socketMessages,
    typingUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    setTyping,
    loading: isMessagesLoading,
    hasMore,
    loadMore,
    error: chatError,
    reconnect
  } = useChat({
    roomId: combinedRoomId
  });

  // Transform socket messages to chat messages with error handling
  const messages: ChatMessageType[] = useMemo(() => {
    try {
      return socketMessages.map(msg => ({
        ...msg,
        replyToId: msg.replyToId ?? null,
        createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
        updatedAt: msg.updatedAt instanceof Date ? msg.updatedAt.toISOString() : msg.updatedAt
      }));
    } catch (error) {
      console.error("Error transforming messages:", error);
      return [];
    }
  }, [socketMessages]);

  // Network status monitoring - ✅ Fixed: removed hook call from inside useEffect
  useEffect(() => {
    const updateOnlineStatus = (online: boolean) => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: online,
        lastConnectionTime: online ? Date.now() : prev.lastConnectionTime,
        reconnectAttempts: online ? 0 : prev.reconnectAttempts
      }));
    };

    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);

    // ✅ Now we can use the user variable that was declared at the top level
    console.log('User in network monitoring:', user?.id);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]); // ✅ Add user as dependency

  // Socket connection monitoring with improved reliability
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const monitorConnection = () => {
      try {
        const socketClient = (window as any).socketClient;
        const isConnected = Boolean(socketClient?.isConnected?.());
        
        setConnectionStatus(prev => ({
          ...prev,
          isSocketConnected: isConnected,
          lastConnectionTime: isConnected ? Date.now() : prev.lastConnectionTime,
          reconnectAttempts: isConnected ? 0 : prev.reconnectAttempts
        }));
      } catch (error) {
        console.error("Connection monitoring error:", error);
        setConnectionStatus(prev => ({
          ...prev,
          isSocketConnected: false
        }));
      }
    };
    
    // Initial check
    monitorConnection();
    
    // Periodic monitoring
    const interval = setInterval(monitorConnection, CONNECTION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced scroll management
  const checkIfNearBottom = useCallback((): boolean => {
    if (!messagesContainerRef.current) return false;
    
    const container = messagesContainerRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    return distanceFromBottom < SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const isNearBottom = checkIfNearBottom();
    shouldAutoScrollRef.current = isNearBottom;
    
    // Track user scrolling
    isUserScrollingRef.current = !isNearBottom;
  }, [checkIfNearBottom]);

  // Auto-scroll logic for new messages
  useEffect(() => {
    const newMessageCount = messages.length;
    const hasNewMessages = newMessageCount > lastMessageCountRef.current;
    
    if (hasNewMessages && shouldAutoScrollRef.current) {
      // Delay scroll to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 100);
    }
    
    lastMessageCountRef.current = newMessageCount;
  }, [messages.length, scrollToBottom]);

  // Room data fetching with exponential backoff
  const fetchRoomData = useCallback(async () => {
    if (!workspaceId || !roomId) return;

    setRoomState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms/${roomId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch room'}`);
      }
      
      const data = await response.json();
      
      if (!data.chatRoom) {
        throw new Error('Invalid room data received');
      }
      
      setRoomState({
        room: data.chatRoom,
        isLoading: false,
        error: null,
        retryCount: 0
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("Room fetch error:", errorMessage);
      
      setRoomState(prev => {
        const newRetryCount = prev.retryCount + 1;
        
        // Auto-retry with exponential backoff for transient errors
        if (newRetryCount <= MAX_RETRY_ATTEMPTS && !errorMessage.includes('404') && !errorMessage.includes('403')) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, newRetryCount - 1);
          setTimeout(() => fetchRoomData(), delay);
        }
        
        return {
          ...prev,
          isLoading: false,
          error: errorMessage,
          retryCount: newRetryCount
        };
      });
    }
  }, [workspaceId, roomId]);

  // Initial room data fetch
  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Message sending with optimistic UI updates
  const handleSendMessage = useCallback(async (content: string, attachments: any[] = []) => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent && (!attachments || attachments.length === 0)) {
      return;
    }
    
    try {
      // Enable auto-scroll for new messages
      shouldAutoScrollRef.current = true;
      
      // Send message
      await sendMessage(trimmedContent, replyingTo?.id || null);
      
      // Clear reply state
      setReplyingTo(null);
      
      // Ensure scroll after message send
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error("Send message error:", errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  }, [sendMessage, replyingTo?.id, scrollToBottom]);

  // Message interaction handlers
  const handleReplyToMessage = useCallback((message: ChatMessageType) => {
    setReplyingTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleTypingChange = useCallback((isTyping: boolean) => {
    setTyping(isTyping);
  }, [setTyping]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await updateMessage(messageId, newContent);
      toast.success("Message updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update message';
      console.error("Edit message error:", errorMessage);
      toast.error(errorMessage);
    }
  }, [updateMessage]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success("Message deleted successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      console.error("Delete message error:", errorMessage);
      toast.error(errorMessage);
    }
  }, [deleteMessage]);

  const handleLoadMore = useCallback(async () => {
    try {
      await loadMore();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      console.error("Load more error:", errorMessage);
      toast.error(errorMessage);
    }
  }, [loadMore]);

  const handleRetryConnection = useCallback(async () => {
    setConnectionStatus(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
    
    try {
      if (reconnect) {
        await reconnect();
        toast.success("Successfully reconnected");
      } else {
        // Fallback to page reload
        window.location.reload();
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
      toast.error("Reconnection failed. Please refresh the page.");
    }
  }, [reconnect]);

  // Connection status banner component
  const ConnectionStatusBanner = () => {
    if (!connectionStatus.isOnline) {
      return (
        <Alert className="rounded-none border-l-0 border-r-0 border-t-0 bg-orange-50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-100">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>You&apos;re currently offline</span>
            <Badge variant="outline" className="text-orange-900 dark:text-orange-100">
              Offline
            </Badge>
          </AlertDescription>
        </Alert>
      );
    }

    if (!connectionStatus.isSocketConnected) {
      return (
        <Alert className="rounded-none border-l-0 border-r-0 border-t-0 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>Reconnecting to chat...</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRetryConnection}
              className="h-6 px-2 text-red-900 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  // Error state rendering
  if (roomState.error && !roomState.room) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-xl font-semibold mb-3">Unable to Load Chat Room</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {roomState.error}
        </p>
        <div className="flex gap-3">
          <Button 
            onClick={fetchRoomData} 
            variant="default"
            disabled={roomState.isLoading}
          >
            {roomState.isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
        {roomState.retryCount > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Attempt {roomState.retryCount} of {MAX_RETRY_ATTEMPTS}
          </p>
        )}
      </div>
    );
  }

  // Loading state rendering
  if (roomState.isLoading && !roomState.room) {
    return (
      <div className="flex flex-col h-full animate-in fade-in-50">
        {/* Header skeleton */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        
        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className={cn(
                  "h-12",
                  i % 3 === 0 ? "w-full max-w-lg" : i % 3 === 1 ? "w-full max-w-md" : "w-full max-w-sm"
                )} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Input skeleton */}
        <div className="p-4 border-t border-border">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus.isSocketConnected && connectionStatus.isOnline;
  const showScrollToBottom = !shouldAutoScrollRef.current && messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Connection status banner */}
      <ConnectionStatusBanner />
      
      {/* Chat header */}
      <div className="shrink-0">
        <ChatHeader
          room={roomState.room} 
          workspaceId={workspaceId}
          typingUsers={typingUsers}
          isConnected={isConnected}
        />
      </div>
      
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-background"
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isMessagesLoading ? (
          // Empty state - centered
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No messages yet
              </h3>
              <p className="text-muted-foreground">
                Start the conversation! Send your first message below.
              </p>
            </div>
          </div>
        ) : (
          // Messages list - full container
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              <ChatMessageList
                messages={messages} 
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={isMessagesLoading}
                onReplyToMessage={handleReplyToMessage}
                workspaceId={workspaceId}
                roomId={roomId}
                onUpdateMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                currentUserId={user?.id} // ✅ Now this works correctly
                onMarkAsRead={undefined} // Optional: implement if needed
                isMessageReadByUser={undefined}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input */}
      <div className="shrink-0 border-t border-border bg-background">
        <ChatInput
          onSendMessage={handleSendMessage} 
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onTyping={handleTypingChange}
          disabled={!isConnected}
          placeholder={
            !connectionStatus.isOnline 
              ? "You're offline. Reconnect to send messages." 
              : !connectionStatus.isSocketConnected 
                ? "Reconnecting to chat..." 
                : undefined
          }
        />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => scrollToBottom()}
          className={cn(
            "absolute bottom-20 right-4 shadow-lg z-10 transition-all duration-200",
            "hover:shadow-xl hover:scale-105",
            "flex items-center gap-2 px-3 py-2"
          )}
        >
          <ChevronDown className="h-4 w-4" />
          <span className="text-sm">New messages</span>
        </Button>
      )}
    </div>
  );
}