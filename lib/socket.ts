/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/socket.ts
import { Server as NetServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

// Next.js API response type with Socket.IO server
export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Custom socket interface to track joined rooms
export interface ServerSocket extends Socket {
  roomIds?: Set<string>;
}

// Socket event types for better type safety
export interface SocketEventData {
  joinChatRoom: string;
  leaveChatRoom: string;
  sendMessage: { roomId: string; message: any };
  editMessage: { roomId: string; message: any };
  deleteMessage: { roomId: string; messageDetails: any };
  typing: { roomId: string; user: { id: string; name: string } };
  stoppedTyping: { roomId: string; userId: string };
}

// Singleton Socket.IO server instance
let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server with proper configuration
 */
export const initSocketServer = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  // Return existing instance if already initialized
  if (res.socket.server.io) {
    console.log('Socket.IO server already initialized');
    return res.socket.server.io;
  }

  console.log('Initializing Socket.IO server...');
  
  // Create new Socket.IO server instance
  const ioServer = new SocketIOServer(res.socket.server, {
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

  // Set up connection handlers
  ioServer.on('connection', (socket: ServerSocket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Initialize room tracking for this socket
    socket.roomIds = new Set();
    
    // Handle room joining
    socket.on('joinChatRoom', (roomId: string) => {
      handleJoinRoom(socket, roomId);
    });
    
    // Handle room leaving
    socket.on('leaveChatRoom', (roomId: string) => {
      handleLeaveRoom(socket, roomId);
    });
    
    // Handle message events
    socket.on('sendMessage', ({ roomId, message }: SocketEventData['sendMessage']) => {
      handleSendMessage(socket, roomId, message);
    });
    
    socket.on('editMessage', ({ roomId, message }: SocketEventData['editMessage']) => {
      handleEditMessage(socket, roomId, message);
    });
    
    socket.on('deleteMessage', ({ roomId, messageDetails }: SocketEventData['deleteMessage']) => {
      handleDeleteMessage(socket, roomId, messageDetails);
    });
    
    // Handle typing indicators
    socket.on('typing', ({ roomId, user }: SocketEventData['typing']) => {
      handleTyping(socket, roomId, user);
    });
    
    socket.on('stoppedTyping', ({ roomId, userId }: SocketEventData['stoppedTyping']) => {
      handleStoppedTyping(socket, roomId, userId);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      handleDisconnect(socket, reason);
    });
  });

  // Store the instance globally and on the server
  res.socket.server.io = ioServer;
  io = ioServer;
  (global as any).socketIo = ioServer;

  return ioServer;
};

/**
 * Socket event handlers
 */
function handleJoinRoom(socket: ServerSocket, roomId: string) {
  try {
    socket.join(roomId);
    socket.roomIds?.add(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    // Acknowledge successful join
    socket.emit('joinedRoom', { roomId, success: true });
  } catch (error) {
    console.error(`Error joining room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to join room', roomId });
  }
}

function handleLeaveRoom(socket: ServerSocket, roomId: string) {
  try {
    socket.leave(roomId);
    socket.roomIds?.delete(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
    
    // Acknowledge successful leave
    socket.emit('leftRoom', { roomId, success: true });
  } catch (error) {
    console.error(`Error leaving room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to leave room', roomId });
  }
}

function handleSendMessage(socket: ServerSocket, roomId: string, message: any) {
  try {
    // Broadcast to everyone else in the room
    socket.to(roomId).emit('newMessage', message);
    console.log(`Message sent to room ${roomId} by socket ${socket.id}`);
  } catch (error) {
    console.error(`Error sending message to room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to send message', roomId });
  }
}

function handleEditMessage(socket: ServerSocket, roomId: string, message: any) {
  try {
    socket.to(roomId).emit('messageUpdated', message);
    console.log(`Message edited in room ${roomId} by socket ${socket.id}`);
  } catch (error) {
    console.error(`Error editing message in room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to edit message', roomId });
  }
}

function handleDeleteMessage(socket: ServerSocket, roomId: string, messageDetails: any) {
  try {
    socket.to(roomId).emit('messageDeleted', messageDetails);
    console.log(`Message deleted in room ${roomId} by socket ${socket.id}`);
  } catch (error) {
    console.error(`Error deleting message in room ${roomId}:`, error);
    socket.emit('error', { message: 'Failed to delete message', roomId });
  }
}

function handleTyping(socket: ServerSocket, roomId: string, user: { id: string; name: string }) {
  try {
    socket.to(roomId).emit('typing', user);
    console.log(`Typing indicator sent for user ${user.name} in room ${roomId}`);
  } catch (error) {
    console.error(`Error sending typing indicator:`, error);
  }
}

function handleStoppedTyping(socket: ServerSocket, roomId: string, userId: string) {
  try {
    socket.to(roomId).emit('stoppedTyping', { userId });
    console.log(`Stopped typing indicator sent for user ${userId} in room ${roomId}`);
  } catch (error) {
    console.error(`Error sending stopped typing indicator:`, error);
  }
}

function handleDisconnect(socket: ServerSocket, reason: string) {
  console.log(`Socket ${socket.id} disconnected: ${reason}`);
  
  // Clean up room memberships
  if (socket.roomIds && socket.roomIds.size > 0) {
    console.log(`Cleaning up ${socket.roomIds.size} rooms for disconnected socket`);
    socket.roomIds.forEach(roomId => {
      socket.leave(roomId);
    });
    socket.roomIds.clear();
  }
}

/**
 * Get the current Socket.IO server instance
 */
export const getSocketIOServer = (): SocketIOServer | null => {
  return io || (global as any).socketIo || null;
};