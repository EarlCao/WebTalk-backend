import { Types } from "mongoose";

import { ConversationModel, IConversation } from "./conversation.model";

const ACTIVE_FILTER = { deletedAt: null } as const;

export class ConversationRepository {
  // ── Create ──────────────────────────────────────────────────────────────────

  async create(data: {
    type: "direct" | "group";
    participants: Types.ObjectId[];
    createdBy: Types.ObjectId;
    name?: string;
    avatar?: string;
  }): Promise<IConversation> {
    return ConversationModel.create(data);
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<IConversation | null> {
    return ConversationModel.findOne({ _id: id, ...ACTIVE_FILTER }).exec();
  }

  /**
   * Find an existing direct conversation between exactly two users.
   * Uses $all + $size so order of participants doesn't matter.
   */
  async findDirectConversation(
    userAId: Types.ObjectId,
    userBId: Types.ObjectId,
  ): Promise<IConversation | null> {
    return ConversationModel.findOne({
      type: "direct",
      participants: { $all: [userAId, userBId], $size: 2 },
      ...ACTIVE_FILTER,
    }).exec();
  }

  /**
   * Paginated list of all active conversations a user is part of,
   * sorted by most-recently-active first.
   */
  async findByParticipant(
    userId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<{ conversations: IConversation[]; total: number }> {
    const filter = { participants: userId, ...ACTIVE_FILTER };

    const [conversations, total] = await Promise.all([
      ConversationModel.find(filter)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("participants", "username avatar status lastSeen")
        .populate("lastMessage")
        .exec(),
      ConversationModel.countDocuments(filter).exec(),
    ]);

    return { conversations, total };
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async updateById(
    id: string,
    data: Partial<Pick<IConversation, "name" | "avatar" | "lastMessage" | "lastMessageAt">>,
  ): Promise<IConversation | null> {
    return ConversationModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: data },
      { new: true },
    ).exec();
  }

  async addParticipants(
    id: string,
    participantIds: Types.ObjectId[],
  ): Promise<IConversation | null> {
    return ConversationModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $addToSet: { participants: { $each: participantIds } } },
      { new: true },
    ).exec();
  }

  async removeParticipant(
    id: string,
    participantId: Types.ObjectId,
  ): Promise<IConversation | null> {
    return ConversationModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $pull: { participants: participantId } },
      { new: true },
    ).exec();
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async softDeleteById(id: string): Promise<IConversation | null> {
    return ConversationModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }
}
