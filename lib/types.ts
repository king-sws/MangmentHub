import { Server as NetServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

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