import mongoose, { Types } from "mongoose";

import { HttpError } from "../../common/utils/http-error";
import { ConversationRepository } from "../conversations/conversation.repository";
import { MessageRepository } from "./message.repository";
import type { EditMessageInput, GetMessagesQueryInput, SendMessageInput } from "./message.schema";
import {
  emitMessageDeleted,
  emitMessageEdited,
  emitMessageRead,
  emitMessageSent,
} from "./message.socket";

const messageRepository = new MessageRepository();
const conversationRepository = new ConversationRepository();

export class MessageService {
  // ── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Resolves the conversation and verifies the requester is a participant.
   * Throws an appropriate HttpError if not.
   */
  private async resolveConversationForMember(requesterId: string, conversationId: string) {
    if (!mongoose.isValidObjectId(conversationId)) {
      throw new HttpError(400, "Invalid conversationId.");
    }

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError(404, "Conversation not found.");
    }

    const isMember = conversation.participants.some((p) => p.toString() === requesterId);
    if (!isMember) {
      throw new HttpError(403, "You are not a member of this conversation.");
    }

    return conversation;
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  async sendMessage(requesterId: string, data: SendMessageInput) {
    await this.resolveConversationForMember(requesterId, data.conversationId);

    const senderOid = new Types.ObjectId(requesterId);
    const conversationOid = new Types.ObjectId(data.conversationId);

    const message = await messageRepository.create({
      conversationId: conversationOid,
      senderId: senderOid,
      content: data.content,
      type: data.type,
    });

    // Keep the parent conversation's last-message pointer in sync
    await conversationRepository.updateById(data.conversationId, {
      lastMessage: message._id as Types.ObjectId,
      lastMessageAt: message.createdAt,
    });

    emitMessageSent(data.conversationId, {
      messageId: message._id.toString(),
      conversationId: data.conversationId,
      senderId: requesterId,
      content: data.content,
      type: data.type || "text",
      createdAt: message.createdAt.toISOString(),
    });

    return message;
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async getMessages(requesterId: string, query: GetMessagesQueryInput) {
    await this.resolveConversationForMember(requesterId, query.conversationId);

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { messages, total } = await messageRepository.findByConversation(
      new Types.ObjectId(query.conversationId),
      skip,
      limit,
    );

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  async editMessage(requesterId: string, messageId: string, data: EditMessageInput) {
    if (!mongoose.isValidObjectId(messageId)) {
      throw new HttpError(400, "Invalid message ID.");
    }

    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, "Message not found.");
    }

    if (message.senderId.toString() !== requesterId) {
      throw new HttpError(403, "You can only edit your own messages.");
    }

    if (message.type !== "text") {
      throw new HttpError(400, "Only text messages can be edited.");
    }

    const updatedMessage = await messageRepository.updateById(messageId, {
      content: data.content,
      editedAt: new Date(),
    });

    if (updatedMessage) {
      emitMessageEdited(message.conversationId.toString(), {
        messageId: messageId,
        conversationId: message.conversationId.toString(),
        content: data.content,
        editedAt: updatedMessage.editedAt!.toISOString(),
      });
    }

    return updatedMessage;
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async deleteMessage(requesterId: string, messageId: string) {
    if (!mongoose.isValidObjectId(messageId)) {
      throw new HttpError(400, "Invalid message ID.");
    }

    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, "Message not found.");
    }

    // Verify the requester is a member of the conversation
    const conversation = await conversationRepository.findById(
      message.conversationId.toString(),
    );
    if (!conversation) {
      throw new HttpError(404, "Associated conversation not found.");
    }

    const isMember = conversation.participants.some((p) => p.toString() === requesterId);
    if (!isMember) {
      throw new HttpError(403, "You are not a member of this conversation.");
    }

    const isSender = message.senderId.toString() === requesterId;
    const isCreator = conversation.createdBy.toString() === requesterId;

    // Only the message sender or the conversation creator may delete a message
    if (!isSender && !isCreator) {
      throw new HttpError(403, "You do not have permission to delete this message.");
    }

    const deleted = await messageRepository.softDeleteById(messageId);
    if (!deleted) {
      throw new HttpError(404, "Message not found or already deleted.");
    }

    // If this was the conversation's lastMessage, update the pointer
    if (conversation.lastMessage?.toString() === messageId) {
      const latest = await messageRepository.findLatestByConversation(message.conversationId);
      const conversationIdStr = message.conversationId.toString();
      if (latest) {
        await conversationRepository.updateById(conversationIdStr, {
          lastMessage: latest._id as Types.ObjectId,
          lastMessageAt: latest.createdAt,
        });
      } else {
        await conversationRepository.clearLastMessage(conversationIdStr);
      }
    }

    emitMessageDeleted(message.conversationId.toString(), {
      messageId: messageId,
      conversationId: message.conversationId.toString(),
    });

    return deleted;
  }

  // ── Mark as read ─────────────────────────────────────────────────────────────

  async markAsRead(requesterId: string, messageId: string) {
    if (!mongoose.isValidObjectId(messageId)) {
      throw new HttpError(400, "Invalid message ID.");
    }

    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, "Message not found.");
    }

    // Ensure the requester is a member of the conversation
    await this.resolveConversationForMember(requesterId, message.conversationId.toString());

    const updatedMessage = await messageRepository.markAsRead(messageId, new Types.ObjectId(requesterId));

    if (updatedMessage) {
      emitMessageRead(message.conversationId.toString(), {
        messageId: messageId,
        conversationId: message.conversationId.toString(),
        readerId: requesterId,
      });
    }

    return updatedMessage;
  }
}
