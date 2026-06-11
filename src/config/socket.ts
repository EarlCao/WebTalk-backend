import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { socketAuthMiddleware } from "../common/middleware/socket-auth.middleware";
import { env } from "./env";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../common/types/socket.types";

export type AppSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// ── Socket registry ───────────────────────────────────────────────────────────

let _io: AppSocketServer | null = null;

export const setIo = (io: AppSocketServer): void => {
  _io = io;
};

export const getIo = (): AppSocketServer => {
  if (!_io) {
    throw new Error("Socket.IO server has not been initialized. Call setIo() first.");
  }
  return _io;
};

// ── Factory ───────────────────────────────────────────────────────────────────

export const createSocketServer = (httpServer: HttpServer): AppSocketServer => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.CORS_ORIGINS,
        credentials: true,
      },
    },
  );

  // Authenticate the socket handshake (sets socket.data.userId / email when a
  // valid JWT is provided) so module handlers can join per-user rooms.
  io.use(socketAuthMiddleware);

  return io;
};
