import { Server as HTTPServer } from 'http';
import { Socket } from 'net';
import { Server as IOServer } from 'socket.io';

export type NextApiResponseServerIO = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
  socket: Socket & {
    server: HTTPServer & {
      io: IOServer;
    };
  };
};
