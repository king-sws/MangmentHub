/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from 'react';
import { socketClient, MessageData } from '@/lib/socketClient';

// Type for messages in the hook - moved to a shared type
export type ChatMessage = MessageData

interface UseChatProps {
  roomId: string;
  initialMessageCount?: number; // Added option to configure initial message count
}

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

// Improved return type for the hook
interface UseChatReturn {
  messages: MessageData[];
  loading: boolean;
  error: string | null;
  typingUsers: { id: string; name: string }[];
  sendMessage: (content: string, replyToId?: string | null) => Promise<MessageData | null>;
  updateMessage: (messageId: string, content: string) => Promise<MessageData | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  setTyping: (isTyping: boolean) => void;
  refreshMessages: () => Promise<void>; // Added refresh method
}

export function useChat({ 
  roomId, 
  initialMessageCount = 30 
}: UseChatProps): UseChatReturn {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  // Use refs for values that shouldn't trigger re-renders
  const loadingRef = useRef<boolean>(false);
  const lastMessageRef = useRef<string | null>(null);
  const roomIdRef = useRef<string>(roomId);
  
  // Keep roomIdRef updated
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  
  // Parse roomId to get workspaceId and chatRoomId
  const parseRoomId = useCallback((id: string) => {
    const [workspaceId, chatRoomId] = id.split(':');
    if (!workspaceId || !chatRoomId) {
      throw new Error('Invalid room ID format. Expected "workspaceId:chatRoomId"');
    }
    return { workspaceId, chatRoomId };
  }, []);

  // Fetch messages from API with improved error handling
  const fetchMessages = useCallback(async (before?: string) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      try {
        // Extract workspaceId and chatRoomId from combined roomId
        const { workspaceId, chatRoomId } = parseRoomId(roomIdRef.current);
        
        if (before) {
          params.append('before', before);
        }
        
        params.append('limit', initialMessageCount.toString());
        
        const url = `/api/workspaces/${workspaceId}/chat/rooms/${chatRoomId}/messages?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update messages state based on whether we're loading more or initial
        if (before) {
          setMessages(prev => {
            // Filter out duplicates based on message ID
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = data.messages.filter((m: MessageData) => !existingIds.has(m.id));
            return [...newMessages, ...prev];
          });
        } else {
          setMessages(data.messages);
        }
        
        setHasMore(data.hasMore || false);
        
        if (data.messages.length > 0) {
          lastMessageRef.current = data.messages[0].id;
        }
      } catch (parseError) {
        console.error("Error parsing room ID:", parseError);
        setError((parseError as Error).message);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(`Failed to load messages. Please try again. ${(err as Error).message}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [parseRoomId, initialMessageCount]);

  // Initialize and fetch messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Clear previous state when changing rooms
        setMessages([]);
        setError(null);
        lastMessageRef.current = null;
        
        // First ensure Socket.IO server is initialized
        await fetch('/api/socketio');
        
        // Track connection attempts
        let connectionAttempts = 0;
        const maxAttempts = 3;
        
        // Wait for socket connection with retry logic
        while (!socketClient.isConnected() && connectionAttempts < maxAttempts) {
          console.log(`Socket not connected, attempt ${connectionAttempts + 1}/${maxAttempts}...`);
          // Wait for a bit to let connection establish
          await new Promise(resolve => setTimeout(resolve, 1000));
          connectionAttempts++;
        }

        // Join room after ensuring socket is connected
        if (socketClient.isConnected()) {
          console.log(`Joining room: ${roomId}`);
          const joined = await socketClient.joinRoom(roomId);
          if (joined) {
            console.log(`Successfully joined room: ${roomId}`);
          } else {
            console.warn(`Room join pending for: ${roomId}`);
          }
        } else {
          console.warn("Socket still not connected, will try to join room on connection");
          // Register a one-time connection event handler
          const handleConnect = () => {
            socketClient.joinRoom(roomId);
          };
          
          socketClient.onEvent('connect', handleConnect);
          // Cleanup the event listener after a timeout
          setTimeout(() => {
            socketClient.offEvent('connect', handleConnect);
          }, 10000);
        }

        // Fetch initial messages
        await fetchMessages();
      } catch (err) {
        console.error("Failed to initialize chat:", err);
        setError("Unable to connect to chat. Please check your connection and try again.");
        setLoading(false);
      }
    };

    if (roomId) {
      initializeChat();
    }

    return () => {
      // Leave room when component unmounts
      if (roomId && socketClient.isConnected()) {
        console.log(`Leaving room: ${roomId}`);
        socketClient.leaveRoom(roomId);
      }
    };
  }, [roomId, fetchMessages]);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (hasMore && lastMessageRef.current && !loadingRef.current) {
      await fetchMessages(lastMessageRef.current);
    }
  }, [hasMore, fetchMessages]);
  
  // Add a refresh messages function
  const refreshMessages = useCallback(async () => {
    lastMessageRef.current = null;
    await fetchMessages();
  }, [fetchMessages]);

  // Setup socket event listeners
  useEffect(() => {
    if (!roomId) return;
    
    try {
      const { chatRoomId } = parseRoomId(roomId);
      
      // Handle new message from socket
      const handleNewMessage = (message: MessageData) => {
        if (message.chatRoomId === chatRoomId) {
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(m => m.id === message.id);
            if (exists) {
              return prev;
            }
            return [...prev, message];
          });
        }
      };
      
      // Handle message updates
      const handleMessageUpdated = (message: MessageData) => {
        if (message.chatRoomId === chatRoomId) {
          setMessages(prev => 
            prev.map(m => (m.id === message.id ? message : m))
          );
        }
      };
      
      // Handle message deletion
      const handleMessageDeleted = (details: { id: string; chatRoomId: string }) => {
        if (details.chatRoomId === chatRoomId) {
          setMessages(prev => prev.filter(m => m.id !== details.id));
        }
      };
      
      // Handle typing indicator
      const handleTyping = (user: { id: string; name: string }) => {
        // Add user to typing users or refresh timestamp if already exists
        setTypingUsers(prev => {
          const exists = prev.some(u => u.id === user.id);
          if (exists) {
            return prev.map(u => 
              u.id === user.id ? { ...u, timestamp: Date.now() } : u
            );
          } else {
            return [...prev, { ...user, timestamp: Date.now() }];
          }
        });
      };
      
      // Handle stopped typing
      const handleStoppedTyping = (data: { userId: string }) => {
        setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
      };
      
      // Register event listeners
      const unsubscribeNewMessage = socketClient.onEvent('newMessage', handleNewMessage);
      const unsubscribeMessageUpdated = socketClient.onEvent('messageUpdated', handleMessageUpdated);
      const unsubscribeMessageDeleted = socketClient.onEvent('messageDeleted', handleMessageDeleted);
      const unsubscribeTyping = socketClient.onEvent('typing', handleTyping);
      const unsubscribeStoppedTyping = socketClient.onEvent('stoppedTyping', handleStoppedTyping);
      
      // Clean up event listeners
      return () => {
        unsubscribeNewMessage();
        unsubscribeMessageUpdated();
        unsubscribeMessageDeleted();
        unsubscribeTyping();
        unsubscribeStoppedTyping();
      };
    } catch (error) {
      console.error("Error setting up socket listeners:", error);
      setError("Error setting up chat connection. Invalid room format.");
      return () => {}; // Return empty cleanup function
    }
  }, [roomId, parseRoomId]);

  // Clean up typing users after timeout
  useEffect(() => {
    const TYPING_TIMEOUT = 3000; // 3 seconds
    
    const typingTimeout = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < TYPING_TIMEOUT)
      );
    }, 1000);
    
    return () => clearInterval(typingTimeout);
  }, []);

  // Send a new message with improved error handling
  const sendMessage = useCallback(async (content: string, replyToId?: string | null): Promise<MessageData | null> => {
    if (!roomId || !content.trim()) return null;
    
    try {
      const { workspaceId, chatRoomId } = parseRoomId(roomId);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms/${chatRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content,
          replyToId: replyToId || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error ${response.status}`;
        throw new Error(`Failed to send message: ${errorMessage}`);
      }
      
      const data = await response.json();
      return data.message;
    } catch (err) {
      console.error("Error sending message:", err);
      setError(`Failed to send message: ${(err as Error).message}`);
      return null;
    }
  }, [roomId, parseRoomId]);

  // Update an existing message with improved error handling
  const updateMessage = useCallback(async (messageId: string, content: string): Promise<MessageData | null> => {
    if (!roomId || !messageId || !content.trim()) return null;
    
    try {
      const { workspaceId, chatRoomId } = parseRoomId(roomId);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms/${chatRoomId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error ${response.status}`;
        throw new Error(`Failed to update message: ${errorMessage}`);
      }
      
      const data = await response.json();
      return data.message;
    } catch (err) {
      console.error("Error updating message:", err);
      setError(`Failed to update message: ${(err as Error).message}`);
      return null;
    }
  }, [roomId, parseRoomId]);

  // Delete a message with improved error handling
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!roomId || !messageId) return false;
    
    try {
      const { workspaceId, chatRoomId } = parseRoomId(roomId);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms/${chatRoomId}/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error ${response.status}`;
        throw new Error(`Failed to delete message: ${errorMessage}`);
      }
      
      return true;
    } catch (err) {
      console.error("Error deleting message:", err);
      setError(`Failed to delete message: ${(err as Error).message}`);
      return false;
    }
  }, [roomId, parseRoomId]);

  // Set typing indicator with better error handling
  const setTyping = useCallback((isTyping: boolean): void => {
    if (!roomId || !socketClient.isConnected()) return;
    
    try {
      // Get user info from local storage or context
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        console.warn("User data not found in localStorage");
        return;
      }
      
      const userData = JSON.parse(userDataString);
      
      // Validate user data
      if (!userData?.id || !userData?.name) {
        console.warn("Invalid user data in localStorage");
        return;
      }
      
      const user = { id: userData.id, name: userData.name };
      
      if (isTyping) {
        socketClient.emitTyping(roomId, user);
      } else {
        socketClient.emitStoppedTyping(roomId, user.id);
      }
    } catch (err) {
      console.error("Error setting typing indicator:", err);
    }
  }, [roomId]);

  return {
    messages,
    loading,
    error,
    typingUsers: typingUsers.map(u => ({ id: u.id, name: u.name })),
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMore,
    hasMore,
    setTyping,
    refreshMessages
  };
}