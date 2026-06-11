import type { AppSocketServer } from "../../config/socket";
import { getIo } from "../../config/socket";
import type { UserProfileUpdatedPayload, UserStatusPayload } from "../../common/types/socket.types";
import { FriendRepository } from "../friends/friend.repository";
import { UserRepository } from "./user.repository";
import { Types } from "mongoose";

const friendRepository = new FriendRepository();
const userRepository = new UserRepository();

// ── Emitters ──────────────────────────────────────────────────────────────────

/**
 * Broadcasts a user's status change (online / offline / away / busy) to everyone.
 */
export const emitUserStatusChanged = async (payload: UserStatusPayload): Promise<void> => {
  const { friends } = await friendRepository.findFriends(new Types.ObjectId(payload.userId), 0, 10000);
  for (const friend of friends) {
    const requesterId = friend.requesterId as any;
    const addresseeId = friend.addresseeId as any;
    const friendId = requesterId._id.toString() === payload.userId
      ? addresseeId._id.toString()
      : requesterId._id.toString();
    getIo().to(friendId).emit("userStatusChanged", payload);
  }
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
    void emitUserStatusChanged({
      userId: socket.data.userId,
      status: "online",
      lastSeen: new Date().toISOString(),
    });

    socket.on("disconnect", () => {
      if (!socket.data.userId) return;

      const now = new Date();
      // Broadcast offline status to everyone
      void emitUserStatusChanged({
        userId: socket.data.userId,
        status: "offline",
        lastSeen: now.toISOString(),
      });

      // Persist offline status to database
      void userRepository.updateStatus(socket.data.userId, "offline", now);
    });
  });
};
