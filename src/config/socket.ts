import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

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

export const createSocketServer = (httpServer: HttpServer): AppSocketServer => {
  return new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.CORS_ORIGINS,
        credentials: true,
      },
    },
  );
};
