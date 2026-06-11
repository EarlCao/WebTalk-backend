import type { AppSocketServer } from "../config/socket";
import type { SocketUserPayload } from "../common/types/socket.types";
import { registerUserSocketHandlers } from "../modules/users/user.socket";

const getSocketUserPayload = (
  socketId: string,
  userId?: string,
  email?: string,
): SocketUserPayload => ({
  socketId,
  ...(userId ? { userId } : {}),
  ...(email ? { email } : {}),
});

export const registerSocketHandlers = (io: AppSocketServer): void => {
  // ── Module handlers ───────────────────────────────────────────────────────────
  registerUserSocketHandlers(io);

  // ── Core handlers ─────────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    io.emit("userConnected", getSocketUserPayload(socket.id, socket.data.userId, socket.data.email));

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("joinRoom", (roomId) => {
      void socket.join(roomId);
    });

    socket.on("leaveRoom", (roomId) => {
      void socket.leave(roomId);
    });


    socket.on("disconnect", () => {
      io.emit("userDisconnected", getSocketUserPayload(socket.id, socket.data.userId, socket.data.email));
    });
  });
};
