import { Types } from "mongoose";

import { IMessage, MessageModel } from "./message.model";
import type { SendMessageInput } from "./message.schema";

const ACTIVE_FILTER = { deletedAt: null } as const;

export class MessageRepository {
  // ── Create ───────────────────────────────────────────────────────────────────

  async create(data: {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: SendMessageInput["content"];
    type: SendMessageInput["type"];
  }): Promise<IMessage> {
    return MessageModel.create(data);
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<IMessage | null> {
    return MessageModel.findOne({ _id: id, ...ACTIVE_FILTER }).exec();
  }

  /**
   * Paginated messages for a conversation, newest first.
   */
  async findByConversation(
    conversationId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<{ messages: IMessage[]; total: number }> {
    const filter = { conversationId, ...ACTIVE_FILTER };

    const [messages, total] = await Promise.all([
      MessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "username avatar status")
        .exec(),
      MessageModel.countDocuments(filter).exec(),
    ]);

    return { messages, total };
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async updateById(
    id: string,
    data: Partial<Pick<IMessage, "content" | "editedAt">>,
  ): Promise<IMessage | null> {
    return MessageModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: data },
      { new: true },
    ).exec();
  }

  /**
   * Adds a userId to the readBy array (idempotent via $addToSet).
   */
  async markAsRead(messageId: string, userId: Types.ObjectId): Promise<IMessage | null> {
    return MessageModel.findOneAndUpdate(
      { _id: messageId, ...ACTIVE_FILTER },
      { $addToSet: { readBy: userId } },
      { new: true },
    ).exec();
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async softDeleteById(id: string): Promise<IMessage | null> {
    return MessageModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  /**
   * Returns the latest active message in a conversation.
   * Used to refresh Conversation.lastMessage after a delete.
   */
  async findLatestByConversation(conversationId: Types.ObjectId): Promise<IMessage | null> {
    return MessageModel.findOne({ conversationId, ...ACTIVE_FILTER })
      .sort({ createdAt: -1 })
      .exec();
  }
}
