import { getIo } from "../../config/socket";
import type { NotificationSocketPayload } from "../../common/types/socket.types";

// ── Emitters ──────────────────────────────────────────────────────────────────
// All notification events target userId rooms (auto-joined on connect via user.socket.ts).

/**
 * Pushes a new notification to the recipient's room.
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
