import type { AppSocketServer } from "../../config/socket";
import { getIo } from "../../config/socket";
import type { NotificationSocketPayload } from "../../common/types/socket.types";

// ── Emitters ──────────────────────────────────────────────────────────────────

/**
 * Pushes a new notification to the recipient's room.
 * The recipient is auto-joined into a room keyed by their userId on connection.
 */
export const emitNotificationReceived = (
  recipientId: string,
  payload: NotificationSocketPayload,
): void => {
  getIo().to(recipientId).emit("notificationReceived", payload);
};

/**
 * Tells the recipient that a specific notification was marked as read.
 */
export const emitNotificationRead = (recipientId: string, notificationId: string): void => {
  getIo().to(recipientId).emit("notificationRead", { notificationId });
};

/**
 * Tells the recipient that all their notifications were marked as read.
 */
export const emitNotificationAllRead = (recipientId: string): void => {
  getIo().to(recipientId).emit("notificationAllRead");
};

// ── Handler registration ──────────────────────────────────────────────────────

/**
 * Registers notification-related socket handlers.
 * Called once by registerSocketHandlers in socket/index.ts.
 */
export const registerNotificationSocketHandlers = (io: AppSocketServer): void => {
  io.on("connection", (socket) => {
    // Auto-join the user into a private room keyed by their userId.
    // This is what makes io.to(userId).emit(...) work for targeted delivery.
    if (socket.data.userId) {
      void socket.join(socket.data.userId);
    }
  });
};
