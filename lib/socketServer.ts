/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/enhancedSocketServer.ts
import { Server as HTTPServer } from 'http';
import { Socket, Server as IOServer } from 'socket.io';
import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from './types';

// Enhanced socket interface with user tracking
export interface EnhancedServerSocket extends Socket {
  roomIds?: Set<string>;
  userId?: string;
  userName?: string;
  lastSeen?: Date;
}

// Read receipt tracking interface
export interface ReadReceipt {
  userId: string;
  userName: string;
  messageId: string;
  readAt: Date;
}

// Typing user interface
export interface TypingUser {
  userId: string;
  userName: string;
  startedAt: Date;
}

// Room state tracking
interface RoomState {
  typingUsers: Map<string, TypingUser>;
  onlineUsers: Map<string, { userId: string; userName: string; lastSeen: Date; socketId: string }>;
  readReceipts: Map<string, ReadReceipt[]>; // messageId -> ReadReceipt[]
}

// Global room states
const roomStates = new Map<string, RoomState>();

// Singleton instance
let io: IOServer | null = null;

/**
 * Get or create room state
 */
function getRoomState(roomId: string): RoomState {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, {
      typingUsers: new Map(),
      onlineUsers: new Map(),
      readReceipts: new Map()
    });
  }
  return roomStates.get(roomId)!;
}

/**
 * Clean up typing users that have been typing for too long (timeout after 3 seconds)
 */
function cleanupTypingUsers(roomId: string) {
  const roomState = getRoomState(roomId);
  const now = new Date();
  const timeout = 3000; // 3 seconds
  
  const toRemove: string[] = [];
  roomState.typingUsers.forEach((typingUser, userId) => {
    if (now.getTime() - typingUser.startedAt.getTime() > timeout) {
      toRemove.push(userId);
    }
  });
  
  toRemove.forEach(userId => {
    roomState.typingUsers.delete(userId);
    // Emit stopped typing event
    io?.to(roomId).emit('stoppedTyping', { userId });
  });
}

/**
 * Initializes the enhanced Socket.IO server
 */
export function initEnhancedSocketServer(server: HTTPServer): IOServer {
  if (io) {
    console.log('Enhanced Socket.IO server already initialized');
    return io;
  }
  
  console.log('Initializing Enhanced Socket.IO server...');
  
  io = new IOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  
  // Set up cleanup interval for typing users
  setInterval(() => {
    roomStates.forEach((_, roomId) => {
      cleanupTypingUsers(roomId);
    });
  }, 1000);
  
  io.on('connection', (socket: EnhancedServerSocket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Initialize socket properties
    socket.roomIds = new Set();
    
    // Handle user authentication/identification
    socket.on('authenticate', ({ userId, userName }: { userId: string; userName: string }) => {
      socket.userId = userId;
      socket.userName = userName;
      socket.lastSeen = new Date();
      console.log(`Socket ${socket.id} authenticated as ${userName} (${userId})`);
      
      // Update user status in all joined rooms
      socket.roomIds?.forEach(roomId => {
        const roomState = getRoomState(roomId);
        roomState.onlineUsers.set(userId, {
          userId,
          userName,
          lastSeen: new Date(),
          socketId: socket.id
        });
        
        // Broadcast user online status
        socket.to(roomId).emit('userOnline', {
          userId,
          userName,
          lastSeen: new Date()
        });
      });
    });
    
    // Handle room joining with enhanced features
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      socket.roomIds?.add(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      const roomState = getRoomState(roomId);
      
      // Add user to online users if authenticated
      if (socket.userId && socket.userName) {
        roomState.onlineUsers.set(socket.userId, {
          userId: socket.userId,
          userName: socket.userName,
          lastSeen: new Date(),
          socketId: socket.id
        });
        
        // Broadcast user joined
        socket.to(roomId).emit('userJoined', {
          userId: socket.userId,
          userName: socket.userName,
          lastSeen: new Date()
        });
      }
      
      // Send current room state to the joining user
      socket.emit('joinedRoom', {
        roomId,
        onlineUsers: Array.from(roomState.onlineUsers.values()),
        typingUsers: Array.from(roomState.typingUsers.values())
      });
    });
    
    // Handle room leaving
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      socket.roomIds?.delete(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
      
      const roomState = getRoomState(roomId);
      
      // Remove user from online users and typing users
      if (socket.userId) {
        roomState.onlineUsers.delete(socket.userId);
        roomState.typingUsers.delete(socket.userId);
        
        // Broadcast user left
        socket.to(roomId).emit('userLeft', {
          userId: socket.userId
        });
        
        // Broadcast stopped typing if user was typing
        socket.to(roomId).emit('stoppedTyping', {
          userId: socket.userId
        });
      }
    });
    
    // Enhanced typing indicator
    socket.on('typing', ({ roomId, user }: { roomId: string, user: { id: string; name: string } }) => {
      const roomState = getRoomState(roomId);
      
      // Add/update typing user
      roomState.typingUsers.set(user.id, {
        userId: user.id,
        userName: user.name,
        startedAt: new Date()
      });
      
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('typing', {
        userId: user.id,
        userName: user.name,
        startedAt: new Date()
      });
      
      console.log(`User ${user.name} started typing in room ${roomId}`);
    });
    
    // Handle stopped typing
    socket.on('stoppedTyping', ({ roomId, userId }: { roomId: string, userId: string }) => {
      const roomState = getRoomState(roomId);
      
      // Remove from typing users
      roomState.typingUsers.delete(userId);
      
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('stoppedTyping', { userId });
      
      console.log(`User ${userId} stopped typing in room ${roomId}`);
    });
    
    // Handle message read receipts
    socket.on('markMessageAsRead', ({ 
      roomId, 
      messageId, 
      userId, 
      userName 
    }: { 
      roomId: string; 
      messageId: string; 
      userId: string; 
      userName: string; 
    }) => {
      const roomState = getRoomState(roomId);
      
      // Get or create read receipts array for this message
      if (!roomState.readReceipts.has(messageId)) {
        roomState.readReceipts.set(messageId, []);
      }
      
      const receipts = roomState.readReceipts.get(messageId)!;
      
      // Check if user already read this message
      const existingReceiptIndex = receipts.findIndex(r => r.userId === userId);
      
      const readReceipt: ReadReceipt = {
        userId,
        userName,
        messageId,
        readAt: new Date()
      };
      
      if (existingReceiptIndex >= 0) {
        // Update existing receipt
        receipts[existingReceiptIndex] = readReceipt;
      } else {
        // Add new receipt
        receipts.push(readReceipt);
      }
      
      // Broadcast read receipt to all users in the room
      io?.to(roomId).emit('messageRead', {
        messageId,
        readBy: {
          userId,
          userName,
          readAt: new Date()
        },
        totalReads: receipts.length
      });
      
      console.log(`Message ${messageId} marked as read by ${userName} in room ${roomId}`);
    });
    
    // Handle bulk mark as read (when user opens chat)
    socket.on('markAllAsRead', ({ 
      roomId, 
      messageIds, 
      userId, 
      userName 
    }: { 
      roomId: string; 
      messageIds: string[]; 
      userId: string; 
      userName: string; 
    }) => {
      const roomState = getRoomState(roomId);
      const readAt = new Date();
      
      messageIds.forEach(messageId => {
        // Get or create read receipts array for this message
        if (!roomState.readReceipts.has(messageId)) {
          roomState.readReceipts.set(messageId, []);
        }
        
        const receipts = roomState.readReceipts.get(messageId)!;
        const existingReceiptIndex = receipts.findIndex(r => r.userId === userId);
        
        const readReceipt: ReadReceipt = {
          userId,
          userName,
          messageId,
          readAt
        };
        
        if (existingReceiptIndex >= 0) {
          receipts[existingReceiptIndex] = readReceipt;
        } else {
          receipts.push(readReceipt);
        }
      });
      
      // Broadcast bulk read update
      io?.to(roomId).emit('messagesRead', {
        messageIds,
        readBy: {
          userId,
          userName,
          readAt
        }
      });
      
      console.log(`${messageIds.length} messages marked as read by ${userName} in room ${roomId}`);
    });
    
    // Get read receipts for specific messages
    socket.on('getReadReceipts', ({ 
      roomId, 
      messageIds 
    }: { 
      roomId: string; 
      messageIds: string[]; 
    }) => {
      const roomState = getRoomState(roomId);
      const receipts: Record<string, ReadReceipt[]> = {};
      
      messageIds.forEach(messageId => {
        receipts[messageId] = roomState.readReceipts.get(messageId) || [];
      });
      
      socket.emit('readReceipts', {
        roomId,
        receipts
      });
    });
    
    // Handle new message with read tracking
    socket.on('sendMessage', ({ roomId, message }: { roomId: string, message: any }) => {
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('newMessage', {
        ...message,
        readBy: [], // Initialize empty read receipts
        deliveredTo: [] // Initialize empty delivery receipts
      });
      
      console.log(`New message sent to room ${roomId}`);
    });
    
    // Handle message updates
    socket.on('editMessage', ({ roomId, message }: { roomId: string, message: any }) => {
      socket.to(roomId).emit('messageUpdated', message);
    });
    
    // Handle message deletion
    socket.on('deleteMessage', ({ roomId, messageDetails }: { roomId: string, messageDetails: any }) => {
      socket.to(roomId).emit('messageDeleted', messageDetails);
      
      // Clean up read receipts for deleted message
      const roomState = getRoomState(roomId);
      roomState.readReceipts.delete(messageDetails.id);
    });
    
    // Handle user presence updates
    socket.on('updatePresence', ({ status }: { status: 'online' | 'away' | 'busy' | 'offline' }) => {
      if (!socket.userId || !socket.userName) return;
      
      socket.lastSeen = new Date();
      
      // Update presence in all joined rooms
      socket.roomIds?.forEach(roomId => {
        const roomState = getRoomState(roomId);
        const userInfo = roomState.onlineUsers.get(socket.userId!);
        
        if (userInfo) {
          userInfo.lastSeen = new Date();
          
          // Broadcast presence update
          socket.to(roomId).emit('userPresenceUpdated', {
            userId: socket.userId,
            userName: socket.userName,
            status,
            lastSeen: new Date()
          });
        }
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
      
      // Clean up user from all rooms
      if (socket.roomIds && socket.roomIds.size > 0) {
        socket.roomIds.forEach(roomId => {
          const roomState = getRoomState(roomId);
          
          if (socket.userId) {
            // Remove from online users
            roomState.onlineUsers.delete(socket.userId);
            
            // Remove from typing users
            roomState.typingUsers.delete(socket.userId);
            
            // Broadcast user went offline
            socket.to(roomId).emit('userOffline', {
              userId: socket.userId,
              lastSeen: socket.lastSeen || new Date()
            });
            
            // Broadcast stopped typing if user was typing
            socket.to(roomId).emit('stoppedTyping', {
              userId: socket.userId
            });
          }
          
          socket.leave(roomId);
        });
      }
    });
  });
  
  return io;
}

/**
 * Returns the Socket.IO server instance
 */
export function getEnhancedIO(): IOServer | null {
  return io;
}

/**
 * Enhanced socket emitters with read/unread functionality
 */
export const enhancedSocketEmitters = {
  // Send new message with read tracking
  newMessage: (roomId: string, message: any) => {
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit newMessage');
      return;
    }
    console.log(`Emitting newMessage to room ${roomId}`);
    io.to(roomId).emit('newMessage', {
      ...message,
      readBy: [],
      deliveredTo: []
    });
  },
  
  // Message updated
  messageUpdated: (roomId: string, message: any) => {
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit messageUpdated');
      return;
    }
    io.to(roomId).emit('messageUpdated', message);
  },
  
  // Message deleted with cleanup
  messageDeleted: (roomId: string, messageDetails: any) => {
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit messageDeleted');
      return;
    }
    
    // Clean up read receipts
    const roomState = getRoomState(roomId);
    roomState.readReceipts.delete(messageDetails.id);
    
    io.to(roomId).emit('messageDeleted', messageDetails);
  },
  
  // Force read receipt update
  broadcastReadReceipt: (roomId: string, messageId: string, readBy: { userId: string; userName: string; readAt: Date }) => {
    if (!io) {
      console.warn('Socket.IO not initialized, cannot broadcast read receipt');
      return;
    }
    
    const roomState = getRoomState(roomId);
    const receipts = roomState.readReceipts.get(messageId) || [];
    
    io.to(roomId).emit('messageRead', {
      messageId,
      readBy,
      totalReads: receipts.length
    });
  },
  
  // Get room statistics
  getRoomStats: (roomId: string) => {
    const roomState = getRoomState(roomId);
    return {
      onlineUsers: Array.from(roomState.onlineUsers.values()),
      typingUsers: Array.from(roomState.typingUsers.values()),
      totalReadReceipts: roomState.readReceipts.size
    };
  }
};

/**
 * Creates and returns the enhanced Socket.IO instance for use in API routes
 */
export function getEnhancedSocketIO(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Enhanced Socket.IO server already initialized on the server');
    return res.socket.server.io;
  }

  console.log('Initializing Enhanced Socket.IO on the server');
  res.socket.server.io = initEnhancedSocketServer(res.socket.server);
  return res.socket.server.io;
}