/* eslint-disable @typescript-eslint/no-explicit-any */
// components/chat/ChatMessageList.tsx - Fixed read receipts integration
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useInView } from "react-intersection-observer";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onReplyToMessage: (message: ChatMessageType) => void;
  workspaceId: string;
  roomId: string;
  isLoading?: boolean;
  typingUsers?: { id: string; name: string }[];
  onUpdateMessage?: (messageId: string, content: string) => Promise<any>;
  onDeleteMessage?: (messageId: string) => Promise<any>;
  // Read receipt props
  onMarkAsRead?: (messageId: string) => void;
  currentUserId?: string;
  isMessageReadByUser?: (messageId: string, userId: string) => boolean;
}

// A minimal debounce implementation for the scroll functionality
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ChatMessageList({
  messages,
  hasMore,
  onLoadMore,
  onReplyToMessage,
  workspaceId,
  roomId,
  isLoading = false,
  typingUsers = [],
  onUpdateMessage,
  onDeleteMessage,
  onMarkAsRead,
  currentUserId,
  isMessageReadByUser
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
  });
  
  const debouncedHasMore = useDebounce(hasMore, 300);
  
  // Keep track of previous messages length to determine if new messages arrived
  const prevMessagesLengthRef = useRef(messages.length);
  
  // Track visible messages for read receipts
  const visibleMessagesRef = useRef<Set<string>>(new Set());
  const readMarkTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Function to handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If user is not at the bottom, disable auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom);
  }, []);

  // Auto-scroll to bottom on new message or typing indicator changes
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    
    // Auto-scroll if:
    // 1. shouldAutoScroll is true AND a new message has arrived
    // 2. OR if this is the first load of messages (messages.length was previously 0)
    const shouldScroll = 
      (shouldAutoScroll && hasNewMessages) || 
      (prevMessagesLengthRef.current > 0 && prevMessagesLengthRef.current <= 2);
    
    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, shouldAutoScroll]);
  
  // Separate effect for typing indicator changes
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current && typingUsers.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingUsers, shouldAutoScroll]);

  // Load more messages when the load more ref is in view
  useEffect(() => {
    if (inView && debouncedHasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, debouncedHasMore, onLoadMore, isLoading]);

  // Enhanced intersection observer for read receipts
  useEffect(() => {
    if (!onMarkAsRead || !currentUserId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && !visibleMessagesRef.current.has(messageId)) {
              visibleMessagesRef.current.add(messageId);
              
              // Find the message to check if it needs to be marked as read
              const message = messages.find(m => m.id === messageId);
              if (message && 
                  message.userId !== currentUserId && // Not own message
                  (!isMessageReadByUser || !isMessageReadByUser(messageId, currentUserId))) {
                
                // Clear any existing timeout for this message
                const existingTimeout = readMarkTimeoutsRef.current.get(messageId);
                if (existingTimeout) {
                  clearTimeout(existingTimeout);
                }
                
                // Set a delay to ensure message is actually viewed
                const timeout = setTimeout(() => {
                  onMarkAsRead(messageId);
                  readMarkTimeoutsRef.current.delete(messageId);
                }, 1000); // Increased to 1 second for better UX
                
                readMarkTimeoutsRef.current.set(messageId, timeout);
              }
            }
          } else {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              visibleMessagesRef.current.delete(messageId);
              
              // Clear timeout if message is no longer visible
              const timeout = readMarkTimeoutsRef.current.get(messageId);
              if (timeout) {
                clearTimeout(timeout);
                readMarkTimeoutsRef.current.delete(messageId);
              }
            }
          }
        });
      },
      {
        threshold: 0.6, // Message must be 60% visible
        rootMargin: '-10px 0px -10px 0px' // Add some margin for better visibility tracking
      }
    );

    // Observe all message elements
    const messageElements = containerRef.current?.querySelectorAll('[data-message-id]');
    messageElements?.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      visibleMessagesRef.current.clear();
      
      // Clear all pending timeouts
      readMarkTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      readMarkTimeoutsRef.current.clear();
    };
  }, [messages, onMarkAsRead, currentUserId, isMessageReadByUser]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setShouldAutoScroll(true);
      setShowScrollButton(false);
    }
  }, []);

  // Group messages by date
  const getDateGroups = () => {
    const groups: Record<string, ChatMessageType[]> = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });
  };

  const dateGroups = getDateGroups();

  // Count unread messages for display
  const unreadCount = currentUserId && isMessageReadByUser 
    ? messages.filter(msg => 
        msg.userId !== currentUserId && 
        !isMessageReadByUser(msg.id, currentUserId)
      ).length 
    : 0;

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      onScroll={handleScroll}
      ref={containerRef}
    >
      {/* Unread messages indicator */}
      {unreadCount > 0 && !shouldAutoScroll && (
        <div className="sticky top-0 z-10 flex justify-center mb-2">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm shadow-lg">
            {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Load more button at the top */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center pb-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onLoadMore()}
            className="text-xs"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
      
      {messages.length === 0 && !isLoading ? (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      ) : null}
      
      {dateGroups.map(([date, dateMessages]) => (
        <div key={date} className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
              {new Date(date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="space-y-3">
            {dateMessages.map((message) => (
              <div key={message.id} data-message-id={message.id}>
                <ChatMessage
                  message={message}
                  onReplyToMessage={onReplyToMessage}
                  workspaceId={workspaceId}
                  roomId={roomId}
                  onUpdateMessage={onUpdateMessage}
                  onDeleteMessage={onDeleteMessage}
                  onMarkAsRead={onMarkAsRead}
                  currentUserId={currentUserId}
                  isMessageReadByUser={isMessageReadByUser}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-center py-2">
          <div className="animate-pulse flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
            <div className="h-2 w-2 bg-muted-foreground rounded-full animation-delay-200"></div>
            <div className="h-2 w-2 bg-muted-foreground rounded-full animation-delay-500"></div>
            Loading messages
          </div>
        </div>
      )}
      
      {/* Typing indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="pb-1">
          <TypingIndicator typingUsers={typingUsers} />
        </div>
      )}
      
      <div ref={messagesEndRef} />
      
      {/* Enhanced scroll button with unread count */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full absolute bottom-24 right-4 shadow-lg opacity-90 hover:opacity-100 transition-opacity relative"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </Button>
      )}
    </div>
  );
}