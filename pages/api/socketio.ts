/* eslint-disable @typescript-eslint/no-explicit-any */
// 1. SIMPLIFIED APPROACH - pages/api/socketio.ts
// This is your main socket.io entry point
import { Server as IOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/lib/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // If Socket.IO server is already initialized, return
  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
    res.status(200).end();
    return;
  }

  console.log('Initializing Socket.IO server...');
  
  // Create and initialize the Socket.IO server
  const io = new IOServer(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Add these transport options to ensure the connection works
    transports: ['polling', 'websocket'],
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Initialize an empty set to track rooms this socket has joined
    const joinedRooms = new Set<string>();
    
    // Handle joining a room
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      socket.join(roomId); // Works with combined IDs
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      // Acknowledge join
      socket.emit('joinedRoom', { roomId });
    });
    
    // Handle leaving a room
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });
    
    // Handle typing indicator
    socket.on('typing', ({ roomId, user }: { roomId: string, user: { id: string; name: string } }) => {
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('typing', user);
    });
    
    // Handle stopped typing indicator
    socket.on('stoppedTyping', ({ roomId, userId }: { roomId: string, userId: string }) => {
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('stoppedTyping', { userId });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Clean up any rooms this socket was in
      joinedRooms.forEach(roomId => {
        socket.leave(roomId);
      });
    });
  });

  // Save the io instance on the server
  res.socket.server.io = io;
  
  // Set a global variable for access from elsewhere
  (global as any).socketIo = io;
  
  // End the response
  res.status(200).end();
}