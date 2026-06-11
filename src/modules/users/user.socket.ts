import type { AppSocketServer } from "../../config/socket";
import { getIo } from "../../config/socket";
import type { UserProfileUpdatedPayload, UserStatusPayload } from "../../common/types/socket.types";

// ── Emitters ──────────────────────────────────────────────────────────────────

/**
 * Broadcasts a user's status change (online / offline / away / busy) to everyone.
 */
export const emitUserStatusChanged = (payload: UserStatusPayload): void => {
  getIo().emit("userStatusChanged", payload);
};

/**
 * Pushes a profile update to the user's own room (multi-device sync).
 */
export const emitUserProfileUpdated = (
  userId: string,
  payload: UserProfileUpdatedPayload,
): void => {
  getIo().to(userId).emit("userProfileUpdated", payload);
};

// ── Handler registration ──────────────────────────────────────────────────────

/**
 * Registers user-related socket handlers.
 * Called once by registerSocketHandlers in socket/index.ts.
 */
export const registerUserSocketHandlers = (io: AppSocketServer): void => {
  io.on("connection", (socket) => {
    if (!socket.data.userId) return;

    // Auto-join user into a private room keyed by their userId.
    // All modules rely on this for targeted delivery (notifications, friend events, etc.)
    void socket.join(socket.data.userId);

    // Broadcast online status to everyone
    emitUserStatusChanged({
      userId: socket.data.userId,
      status: "online",
      lastSeen: new Date().toISOString(),
    });

    socket.on("disconnect", () => {
      if (!socket.data.userId) return;

      // Broadcast offline status to everyone
      emitUserStatusChanged({
        userId: socket.data.userId,
        status: "offline",
        lastSeen: new Date().toISOString(),
      });
    });
  });
};
