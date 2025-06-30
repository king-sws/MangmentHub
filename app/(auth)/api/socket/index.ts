// Updated version of app/api/socket/index.ts
import { NextApiRequest } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponseServerIO } from '@/lib/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check if Socket.IO server is already initialized
  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
    return res.status(200).json({ message: 'Socket server is already running' });
  }

  console.log('Initializing Socket.IO server...');
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socketio', // Make sure this matches the client configuration
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Save the IO server instance
  res.socket.server.io = io;

  // Set up connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Track rooms this socket joins
    const joinedRooms = new Set<string>();
    
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      joinedRooms.add(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      // Acknowledge join
      socket.emit('joinedRoom', { roomId });
    });
    
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });
    
    socket.on('typing', ({ roomId, user }: { roomId: string, user: { id: string; name: string } }) => {
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('typing', user);
    });
    
    socket.on('stoppedTyping', ({ roomId, userId }: { roomId: string, userId: string }) => {
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('stoppedTyping', { userId });
    });
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Clean up any rooms this socket was in
      joinedRooms.forEach(roomId => {
        socket.leave(roomId);
      });
    });
  });

  console.log('Socket.IO handler processed successfully');
  return res.status(200).json({ message: 'Socket server is running' });
}