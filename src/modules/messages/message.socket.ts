import { getIo } from "../../config/socket";
import type {
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageReadPayload,
  MessageSentPayload,
} from "../../common/types/socket.types";

// ── Emitters ──────────────────────────────────────────────────────────────────
// All emits target the conversationId room.
// Clients join a conversation room by calling joinRoom(conversationId).

/**
 * Notifies all members of a conversation that a new message was sent.
 */
export const emitMessageSent = (
  conversationId: string,
  payload: MessageSentPayload,
): void => {
  getIo().to(conversationId).emit("messageSent", payload);
};

/**
 * Notifies all members that a message was edited.
 */
export const emitMessageEdited = (
  conversationId: string,
  payload: MessageEditedPayload,
): void => {
  getIo().to(conversationId).emit("messageEdited", payload);
};

/**
 * Notifies all members that a message was deleted.
 */
export const emitMessageDeleted = (
  conversationId: string,
  payload: MessageDeletedPayload,
): void => {
  getIo().to(conversationId).emit("messageDeleted", payload);
};

/**
 * Notifies all members that a message was read by someone.
 */
export const emitMessageRead = (
  conversationId: string,
  payload: MessageReadPayload,
): void => {
  getIo().to(conversationId).emit("messageRead", payload);
};
