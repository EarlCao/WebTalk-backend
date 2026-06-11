import { getIo } from "../../config/socket";
import type {
  FriendRemovedPayload,
  FriendRequestAcceptedPayload,
  FriendRequestCancelledPayload,
  FriendRequestDeclinedPayload,
  FriendRequestSentPayload,
} from "../../common/types/socket.types";

// ── Emitters ──────────────────────────────────────────────────────────────────
// All friend events target userId rooms (auto-joined on connect via user.socket.ts).

/**
 * Notifies the addressee that they received a friend request.
 */
export const emitFriendRequestSent = (
  addresseeId: string,
  payload: FriendRequestSentPayload,
): void => {
  getIo().to(addresseeId).emit("friendRequestSent", payload);
};

/**
 * Notifies the original requester that their request was accepted.
 */
export const emitFriendRequestAccepted = (
  requesterId: string,
  payload: FriendRequestAcceptedPayload,
): void => {
  getIo().to(requesterId).emit("friendRequestAccepted", payload);
};

/**
 * Notifies the original requester that their request was declined.
 */
export const emitFriendRequestDeclined = (
  requesterId: string,
  payload: FriendRequestDeclinedPayload,
): void => {
  getIo().to(requesterId).emit("friendRequestDeclined", payload);
};

/**
 * Notifies the addressee that the pending request was cancelled by the requester.
 */
export const emitFriendRequestCancelled = (
  addresseeId: string,
  payload: FriendRequestCancelledPayload,
): void => {
  getIo().to(addresseeId).emit("friendRequestCancelled", payload);
};

/**
 * Notifies the other user that the friendship was removed.
 */
export const emitFriendRemoved = (
  otherUserId: string,
  payload: FriendRemovedPayload,
): void => {
  getIo().to(otherUserId).emit("friendRemoved", payload);
};
