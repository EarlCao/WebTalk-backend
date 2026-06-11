import { getIo } from "../../config/socket";
import type {
  ConversationCreatedPayload,
  ConversationDeletedPayload,
  ConversationUpdatedPayload,
  ParticipantAddedPayload,
  ParticipantRemovedPayload,
} from "../../common/types/socket.types";

// ── Emitters ──────────────────────────────────────────────────────────────────

/**
 * Notifies each participant individually that a new conversation was created.
 * Uses userId rooms (auto-joined on connect) since the conversation room
 * doesn't exist on the client yet at creation time.
 */
export const emitConversationCreated = (
  participantIds: string[],
  payload: ConversationCreatedPayload,
): void => {
  for (const participantId of participantIds) {
    getIo().to(participantId).emit("conversationCreated", payload);
  }
};

/**
 * Notifies all members that a group conversation's details were updated.
 */
export const emitConversationUpdated = (
  conversationId: string,
  payload: ConversationUpdatedPayload,
): void => {
  getIo().to(conversationId).emit("conversationUpdated", payload);
};

/**
 * Notifies all existing members that new participants were added.
 */
export const emitParticipantAdded = (
  conversationId: string,
  payload: ParticipantAddedPayload,
): void => {
  getIo().to(conversationId).emit("participantAdded", payload);
};

/**
 * Notifies all members that a participant was removed or left.
 */
export const emitParticipantRemoved = (
  conversationId: string,
  payload: ParticipantRemovedPayload,
): void => {
  getIo().to(conversationId).emit("participantRemoved", payload);
};

/**
 * Notifies all members that the conversation was deleted.
 */
export const emitConversationDeleted = (
  conversationId: string,
  payload: ConversationDeletedPayload,
): void => {
  getIo().to(conversationId).emit("conversationDeleted", payload);
};
