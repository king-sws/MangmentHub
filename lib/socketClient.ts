/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import io, { Socket } from 'socket.io-client';

// Enhanced interfaces
export interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: Date;
}

export interface EnhancedMessageData {
  id: string;
  content: string;
  userId: string;
  chatRoomId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isSystemMessage: boolean;
  replyToId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  reactions?: any[];
  attachments?: any[];
  replyTo?: any;
  // Enhanced fields
  readBy?: ReadReceipt[];
  deliveredTo?: string[];
}

export interface ChatMember {
  id: string;
  userId: string;
  chatRoomId: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastReadAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

// Enhanced socket events interface
export interface EnhancedSocketEvents {
  // Message events
  newMessage: (message: EnhancedMessageData) => void;
  messageUpdated: (message: EnhancedMessageData) => void;
  messageDeleted: (details: { id: string; chatRoomId: string; userId: string }) => void;
  
  // Member events
  memberAdded: (member: ChatMember) => void;
  memberRemoved: (data: { memberId: string }) => void;
  memberUpdated: (member: ChatMember) => void;
  
  // Enhanced typing events
  typing: (data: { userId: string; userName: string; startedAt: Date }) => void;
  stoppedTyping: (data: { userId: string }) => void;
  
  // NEW: Read receipt events
  messageRead: (data: { 
    messageId: string; 
    readBy: ReadReceipt; 
    totalReads: number 
  }) => void;
  messagesRead: (data: {
    messageIds: string[];
    readBy: ReadReceipt;
  }) => void;
  readReceipts: (data: {
    roomId: string;
    receipts: Record<string, ReadReceipt[]>;
  }) => void;
  
  // Enhanced presence events
  userOnline: (user: { userId: string; userName: string; lastSeen: Date }) => void;
  userOffline: (user: { userId: string; lastSeen: Date }) => void;
  userJoined: (user: { userId: string; userName: string; lastSeen: Date }) => void;
  userLeft: (data: { userId: string }) => void;
  userPresenceUpdated: (user: { 
    userId: string; 
    userName: string; 
    status: string; 
    lastSeen: Date 
  }) => void;
  
  // Room events
  joinedRoom: (data: { 
    roomId: string;
    onlineUsers?: any[];
    typingUsers?: any[];
  }) => void;
  
  // Connection events
  error: (error: Error) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  reconnect: (attemptNumber: number) => void;
  reconnecting: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;
}

// For backward compatibility
export interface MessageData extends EnhancedMessageData {}
export interface SocketEvents extends EnhancedSocketEvents {}

class EnhancedSocketClient {
  private static instance: EnhancedSocketClient;
  private socket: typeof Socket | null = null;
  private connectedRooms: Set<string> = new Set();
  private reconnectTimeout: NodeJS.Timeout | undefined;
  private connectionState: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private initAttempts: number = 0;
  private maxInitAttempts: number = 5;
  private messageQueueMap: Map<string, EnhancedMessageData[]> = new Map();
  
  // Enhanced state tracking
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private onlineUsers: Map<string, { userId: string; userName: string; lastSeen: Date }> = new Map();
  private roomTypingUsers: Map<string, Set<string>> = new Map();
  
  private constructor() {
    // Initialize socket with slight delay to ensure window is available
    if (typeof window !== 'undefined') {
      setTimeout(() => this.init(), 100);
    }
  }
  
  public static getInstance(): EnhancedSocketClient {
    if (!EnhancedSocketClient.instance) {
      EnhancedSocketClient.instance = new EnhancedSocketClient();
    }
    return EnhancedSocketClient.instance;
  }
  
  private init() {
    if (typeof window === 'undefined') return; // Only initialize on client side
    if (this.socket) return;
    
    if (this.initAttempts >= this.maxInitAttempts) {
      console.error(`Failed to connect after ${this.maxInitAttempts} attempts. Please check network connection and server status.`);
      return;
    }
    
    this.initAttempts++;
    
    try {
      console.log(`Initializing socket connection (attempt ${this.initAttempts})...`);
      
      // Get the origin from the window location
      const origin = window.location.origin;
      console.log(`Using origin: ${origin}`);
      
      // Pre-initialize socket.io server
      console.log('Pre-initializing socket.io server...');
      fetch(`${origin}/api/socketio`)
        .then(response => {
          console.log('Socket.io server initialization response:', response.status);
          this.connectSocket(origin);
        })
        .catch(error => {
          console.error('Error initializing socket.io server:', error);
          this.connectSocket(origin); // Try to connect anyway
        });
      
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.scheduleReconnect();
    }
  }
  
  private connectSocket(origin: string) {
    try {
      // Use the configured URL or fallback to window.location.origin
      const socketUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
      console.log(`Socket URL: ${socketUrl}`);
      
      // Important: Create a connection with proper configuration
      this.socket = io(socketUrl, {
        path: '/api/socketio',
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 30000,
        // Start with websocket, fall back to polling if needed
        transports: ['websocket', 'polling'],
        forceNew: true,
        autoConnect: true
      });
      
      console.log('Socket object created, setting up listeners');
      this.setupListeners();
      
      // Make socket available globally for debugging
      (window as any).socketClient = this;
      
    } catch (error) {
      console.error('Socket connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  private setupListeners() {
    if (!this.socket) {
      console.error('Cannot setup listeners: socket is null');
      return;
    }
    
    // Add a connecting listener
    this.socket.io.on('connect_error', (err: { message: any; }) => {
      console.error('Connection error:', err.message);
      this.connectionState = 'disconnected';
    });
    
    this.socket.io.on('reconnect_attempt', () => {
      console.log('Socket reconnect attempt...');
      this.connectionState = 'connecting';
    });
    
    this.socket.on('connect', () => {
      console.log('Socket connected successfully!', this.socket?.id);
      this.connectionState = 'connected';
      this.initAttempts = 0; // Reset attempt counter on successful connection
      
      // Re-authenticate if we have user info
      if (this.currentUserId && this.currentUserName) {
        this.authenticate(this.currentUserId, this.currentUserName);
      }
      
      // Rejoin rooms if reconnecting
      if (this.connectedRooms.size > 0) {
        console.log(`Rejoining ${this.connectedRooms.size} rooms after connect:`, Array.from(this.connectedRooms));
        this.connectedRooms.forEach(roomId => {
          console.log(`Re-joining room: ${roomId}`);
          this.socket?.emit('joinRoom', roomId);
          
          // Send any queued messages for this room
          this.sendQueuedMessages(roomId);
        });
      }
    });
    
    this.socket.on('connect_error', (error: { message: any; }) => {
      console.error('Socket connect_error:', error.message);
      this.connectionState = 'disconnected';
      this.checkServerAvailability();
    });
    
    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.connectionState = 'disconnected';
      
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Disconnected by the server or client, manual reconnect needed
        this.scheduleReconnect();
      }
    });
    
    this.socket.on('reconnect', (attemptNumber: any) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.connectionState = 'connected';
    });
    
    this.socket.on('reconnect_attempt', (attemptNumber: any) => {
      console.log(`Reconnection attempt: ${attemptNumber}`);
      this.connectionState = 'connecting';
    });
    
    this.socket.on('reconnect_error', (error: { message: any; }) => {
      console.error('Reconnection error:', error.message);
    });
    
    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      this.scheduleReconnect();
    });
    
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
    
    // Listen for room join confirmations
    this.socket.on('joinedRoom', (data: { 
      roomId: string; 
      onlineUsers?: any[];
      typingUsers?: any[];
    }) => {
      console.log(`Received confirmation of joining room: ${data.roomId}`);
      this.connectedRooms.add(data.roomId);
      
      // Update online users for this room
      if (data.onlineUsers) {
        data.onlineUsers.forEach(user => {
          this.onlineUsers.set(user.userId, user);
        });
      }
      
      // Update typing users for this room
      if (data.typingUsers) {
        const typingSet = new Set(data.typingUsers.map((u: any) => u.userId));
        this.roomTypingUsers.set(data.roomId, typingSet);
      }
      
      // Send any queued messages for this room
      this.sendQueuedMessages(data.roomId);
    });
    
    // Enhanced presence event listeners
    this.socket.on('userOnline', (user: { userId: string; userName: string; lastSeen: Date }) => {
      this.onlineUsers.set(user.userId, user);
      console.log(`User ${user.userName} is now online`);
    });
    
    this.socket.on('userOffline', (user: { userId: string; lastSeen: Date }) => {
      this.onlineUsers.delete(user.userId);
      console.log(`User ${user.userId} is now offline`);
    });
    
    this.socket.on('userJoined', (user: { userId: string; userName: string; lastSeen: Date }) => {
      this.onlineUsers.set(user.userId, user);
      console.log(`User ${user.userName} joined`);
    });
    
    this.socket.on('userLeft', (data: { userId: string }) => {
      this.onlineUsers.delete(data.userId);
      console.log(`User ${data.userId} left`);
    });
  }
  
  // Send any queued messages for this room
  private sendQueuedMessages(roomId: string) {
    const queuedMessages = this.messageQueueMap.get(roomId) || [];
    if (queuedMessages.length > 0) {
      console.log(`Sending ${queuedMessages.length} queued messages for room ${roomId}`);
      
      queuedMessages.forEach(message => {
        this.socket?.emit('sendMessage', { roomId, message });
      });
      
      // Clear the queue
      this.messageQueueMap.delete(roomId);
    }
  }
  
  // Check if server is available by making a simple HEAD request
  private async checkServerAvailability() {
    try {
      // Use a simple HEAD request to check if server is available
      console.log('Checking server availability...');
      const response = await fetch('/api/health', { method: 'GET' });
      console.log(`Server availability check: ${response.status === 200 ? 'Available' : 'Unavailable'}`);
      
      // If server responded but socket still disconnected, try reconnecting
      if (response.ok && this.connectionState === 'disconnected') {
        this.scheduleReconnect();
      }
    } catch (error) {
      console.error('Server availability check failed:', error);
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const delay = Math.min(5000 * (this.initAttempts || 1), 30000); // Exponential backoff with max 30s
    console.log(`Scheduling reconnect in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect socket...');
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      this.init();
    }, delay);
  }
  
  // NEW: Authenticate user for enhanced features
  public authenticate(userId: string, userName: string): void {
    this.currentUserId = userId;
    this.currentUserName = userName;
    
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { userId, userName });
    }
  }
  
  // NEW: Get current user info
  public getCurrentUser(): { userId: string; userName: string } | null {
    if (this.currentUserId && this.currentUserName) {
      return { userId: this.currentUserId, userName: this.currentUserName };
    }
    return null;
  }
  
  // NEW: Get online users
  public getOnlineUsers(): Array<{ userId: string; userName: string; lastSeen: Date }> {
    return Array.from(this.onlineUsers.values());
  }
  
  // NEW: Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
  
  public getSocket(): typeof Socket | null {
    return this.socket;
  }
  
  public isConnected(): boolean {
    return this.connectionState === 'connected' && this.socket?.connected === true;
  }
  
  public getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionState;
  }
  
  public async joinRoom(roomId: string): Promise<boolean> {
    console.log(`Attempting to join room: ${roomId}, connection state: ${this.connectionState}`);
    
    // Always store the room ID in our set to rejoin on reconnection
    this.connectedRooms.add(roomId);
    
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, added ${roomId} to pending rooms list`);
      return false;
    }
    
    console.log(`Emitting joinRoom for: ${roomId}`);
    this.socket.emit('joinRoom', roomId);
    return true;
  }

  public getConnectedRooms(): string[] {
    return Array.from(this.connectedRooms);
  }
  
  public leaveRoom(roomId: string): void {
    console.log(`Leaving room: ${roomId}`);
    
    if (this.socket?.connected) {
      this.socket.emit('leaveRoom', roomId);
    }
    this.connectedRooms.delete(roomId);
    this.roomTypingUsers.delete(roomId);
    
    // Clear any queued messages for this room
    this.messageQueueMap.delete(roomId);
  }
  
  public onEvent<K extends keyof EnhancedSocketEvents>(
    event: K, 
    callback: EnhancedSocketEvents[K]
  ): () => void {
    console.log(`Registering handler for event: ${String(event)}`);
    
    if (!this.socket) {
      console.warn(`Socket not initialized, event ${String(event)} will be registered when socket connects`);
      this.init(); // Try to initialize the socket
    }
    
    this.socket?.on(event as string, callback as any);
    
    // Return an unsubscribe function
    return () => {
      console.log(`Unregistering handler for event: ${String(event)}`);
      this.socket?.off(event as string, callback as any);
    };
  }
  
  public offEvent<K extends keyof EnhancedSocketEvents>(
    event: K, 
    callback?: EnhancedSocketEvents[K]
  ): void {
    if (callback) {
      this.socket?.off(event as string, callback as any);
    } else {
      this.socket?.off(event as string);
    }
  }
  
  public emitTyping(roomId: string, user: { id: string; name: string }): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, can't emit typing for user ${user.name}`);
      return;
    }
    
    console.log(`Emitting typing notification for user ${user.name} in room ${roomId}`);
    this.socket.emit('typing', { 
      roomId, 
      userId: user.id, 
      userName: user.name,
      startedAt: new Date()
    });
    
    // Clear existing timeout for this user+room if any
    const timeoutKey = `${roomId}-${user.id}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey));
    }
    
    // Set a timeout to automatically emit stoppedTyping after 3 seconds
    this.typingTimeouts.set(
      timeoutKey,
      setTimeout(() => {
        this.emitStoppedTyping(roomId, user.id);
      }, 3000)
    );
  }
  
  public emitStoppedTyping(roomId: string, userId: string): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, can't emit stoppedTyping for user ${userId}`);
      return;
    }
    
    console.log(`Emitting stopped typing notification for user ${userId} in room ${roomId}`);
    this.socket.emit('stoppedTyping', { roomId, userId });
    
    // Clear the timeout
    const timeoutKey = `${roomId}-${userId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey));
      this.typingTimeouts.delete(timeoutKey);
    }
  }
  
  // NEW: Mark message as read
  public markMessageAsRead(roomId: string, messageId: string): void {
    if (!this.socket?.connected || !this.currentUserId || !this.currentUserName) {
      console.warn('Cannot mark message as read: socket not connected or user not authenticated');
      return;
    }
    
    console.log(`Marking message ${messageId} as read in room ${roomId}`);
    this.socket.emit('markMessageAsRead', {
      roomId,
      messageId,
      userId: this.currentUserId,
      userName: this.currentUserName
    });
  }
  
  // NEW: Mark all messages as read
  public markAllAsRead(roomId: string, messageIds: string[]): void {
    if (!this.socket?.connected || !this.currentUserId || !this.currentUserName) {
      console.warn('Cannot mark messages as read: socket not connected or user not authenticated');
      return;
    }
    
    console.log(`Marking ${messageIds.length} messages as read in room ${roomId}`);
    this.socket.emit('markAllAsRead', {
      roomId,
      messageIds,
      userId: this.currentUserId,
      userName: this.currentUserName
    });
  }
  
  // Send a message
  public sendMessage(roomId: string, message: any): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, can't send message to room ${roomId}`);
      return;
    }
    
    console.log(`Sending message to room ${roomId}`);
    this.socket.emit('sendMessage', { roomId, message });
  }
  
  // Edit a message
  public editMessage(roomId: string, message: any): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, can't edit message in room ${roomId}`);
      return;
    }
    
    console.log(`Editing message in room ${roomId}`);
    this.socket.emit('editMessage', { roomId, message });
  }
  
  // Delete a message
  public deleteMessage(roomId: string, messageDetails: any): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected, can't delete message in room ${roomId}`);
      return;
    }
    
    console.log(`Deleting message in room ${roomId}`);
    this.socket.emit('deleteMessage', { roomId, messageDetails });
  }
  
  // Force a reconnection attempt
  public reconnect(): void {
    console.log('Forcing socket reconnection');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.init();
  }
  
  // Debugging method to get detailed connection info
  public getDebugInfo(): any {
    return {
      connectionState: this.connectionState,
      socketId: this.socket?.id || null,
      connectedRooms: Array.from(this.connectedRooms),
      socketConnected: this.socket?.connected || false,
      initAttempts: this.initAttempts,
      currentUser: this.getCurrentUser(),
      onlineUsersCount: this.onlineUsers.size,
      roomTypingUsers: Object.fromEntries(
        Array.from(this.roomTypingUsers.entries()).map(([roomId, users]) => [
          roomId,
          Array.from(users)
        ])
      )
    };
  }
}

export const socketClient = EnhancedSocketClient.getInstance();

// Hook to simplify usage in React components
import { useEffect, useRef } from 'react';

export function useSocketEvent<K extends keyof EnhancedSocketEvents>(
  event: K, 
  callback: EnhancedSocketEvents[K],
  dependencies: any[] = []
) {
  const savedCallback = useRef<EnhancedSocketEvents[K]>(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const handler = (...args: any[]) => {
      (savedCallback.current as (...args: any[]) => void)(...args);
    };
    
    const unsubscribe = socketClient.onEvent(event, handler as any);
    
    return () => {
      unsubscribe();
    };
  }, [event, ...dependencies]);
}