import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    const joinedRooms = new Set<string>();

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      joinedRooms.add(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      socket.emit('joined-room', { roomId });
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('send-message', (data) => {
      const { roomId, message } = data;
      console.log(`New message in ${roomId}: ${message.content}`);
      socket.to(roomId).emit('new-message', message);
    });

    socket.on('edit-message', (data) => {
      const { roomId, messageId, content } = data;
      socket.to(roomId).emit('message-updated', { messageId, content });
    });

    socket.on('delete-message', (data) => {
      const { roomId, messageId } = data;
      socket.to(roomId).emit('message-deleted', { messageId });
    });

    socket.on('add-reaction', (data) => {
      const { roomId, messageId, reaction } = data;
      socket.to(roomId).emit('new-reaction', { messageId, reaction });
    });

    socket.on('typing', (data) => {
      const { roomId, user } = data;
      socket.to(roomId).emit('user-typing', user);
    });

    socket.on('stop-typing', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-stopped-typing', userId);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      joinedRooms.forEach((roomId) => {
        socket.leave(roomId);
      });
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
