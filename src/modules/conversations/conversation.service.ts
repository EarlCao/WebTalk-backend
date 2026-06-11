import mongoose, { Types } from "mongoose";

import { HttpError } from "../../common/utils/http-error";
import { UserRepository } from "../users/user.repository";
import { ConversationRepository } from "./conversation.repository";
import type {
  AddParticipantsInput,
  CreateDirectConversationInput,
  CreateGroupConversationInput,
  GetConversationsQueryInput,
  UpdateGroupConversationInput,
} from "./conversation.schema";
import { IConversation } from "./conversation.model";
import {
  emitConversationCreated,
  emitConversationDeleted,
  emitConversationUpdated,
  emitParticipantAdded,
  emitParticipantRemoved,
} from "./conversation.socket";

const conversationRepository = new ConversationRepository();
const userRepository = new UserRepository();

export class ConversationService {
  // ── Create ──────────────────────────────────────────────────────────────────

  async createDirectConversation(
    requesterId: string,
    data: CreateDirectConversationInput,
  ) {
    if (requesterId === data.participantId) {
      throw new HttpError(400, "You cannot start a conversation with yourself.");
    }

    const participant = await userRepository.findById(data.participantId);
    if (!participant) {
      throw new HttpError(404, "The specified participant was not found.");
    }

    const requesterOid = new Types.ObjectId(requesterId);
    const participantOid = new Types.ObjectId(data.participantId);

    // Return existing conversation if one already exists between these two users
    const existing = await conversationRepository.findDirectConversation(
      requesterOid,
      participantOid,
    );
    if (existing) return existing;

    const conversation = await conversationRepository.create({
      type: "direct",
      participants: [requesterOid, participantOid],
      createdBy: requesterOid,
    });

    emitConversationCreated(
      [requesterId, data.participantId],
      {
        conversationId: conversation._id.toString(),
        type: "direct",
        createdBy: requesterId,
        participants: [requesterId, data.participantId],
        createdAt: conversation.createdAt.toISOString(),
      }
    );

    return conversation;
  }

  async createGroupConversation(
    requesterId: string,
    data: CreateGroupConversationInput,
  ) {
    const requesterOid = new Types.ObjectId(requesterId);

    // Verify all provided participant IDs resolve to real users
    const participantOids: Types.ObjectId[] = [];
    for (const id of data.participantIds) {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new HttpError(404, `Participant with ID "${id}" was not found.`);
      }
      participantOids.push(new Types.ObjectId(id));
    }

    // Creator is always included in the participants list
    const allParticipants = [
      requesterOid,
      ...participantOids.filter((oid) => !oid.equals(requesterOid)),
    ];

    const conversation = await conversationRepository.create({
      type: "group",
      participants: allParticipants,
      createdBy: requesterOid,
      name: data.name,
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    });

    const participantStrs = allParticipants.map(p => p.toString());
    emitConversationCreated(
      participantStrs,
      {
        conversationId: conversation._id.toString(),
        type: "group",
        name: data.name,
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        createdBy: requesterId,
        participants: participantStrs,
        createdAt: conversation.createdAt.toISOString(),
      }
    );

    return conversation;
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async getConversations(requesterId: string, query: GetConversationsQueryInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { conversations, total } = await conversationRepository.findByParticipant(
      new Types.ObjectId(requesterId),
      skip,
      limit,
    );

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversationById(requesterId: string, conversationId: string) {
    if (!mongoose.isValidObjectId(conversationId)) {
      throw new HttpError(400, "Invalid conversation ID.");
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

  // ── Update (group only) ───────────────────────────────────────────────────────

  async updateGroupConversation(
    requesterId: string,
    conversationId: string,
    data: UpdateGroupConversationInput,
  ) {
    const conversation = await this.getConversationById(requesterId, conversationId);

    if (conversation.type !== "group") {
      throw new HttpError(400, "Only group conversations can be updated.");
    }

    const updated = await conversationRepository.updateById(conversationId, data as Partial<Pick<IConversation, "name" | "avatar">>);
    if (updated) {
      emitConversationUpdated(conversationId, {
        conversationId,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      });
    }
    return updated;
  }

  async addParticipants(
    requesterId: string,
    conversationId: string,
    data: AddParticipantsInput,
  ) {
    const conversation = await this.getConversationById(requesterId, conversationId);

    if (conversation.type !== "group") {
      throw new HttpError(400, "Participants can only be added to group conversations.");
    }

    if (conversation.participants.length + data.participantIds.length > 50) {
      throw new HttpError(400, "A group conversation can have at most 50 participants (including yourself).");
    }

    const participantOids: Types.ObjectId[] = [];
    for (const id of data.participantIds) {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new HttpError(404, `Participant with ID "${id}" was not found.`);
      }
      participantOids.push(new Types.ObjectId(id));
    }

    const updated = await conversationRepository.addParticipants(conversationId, participantOids);
    if (updated) {
      emitParticipantAdded(conversationId, {
        conversationId,
        participantIds: data.participantIds,
      });
    }
    return updated;
  }

  async removeParticipant(
    requesterId: string,
    conversationId: string,
    participantId: string,
  ) {
    if (!mongoose.isValidObjectId(participantId)) {
      throw new HttpError(400, "Invalid participant ID.");
    }

    const conversation = await this.getConversationById(requesterId, conversationId);

    if (conversation.type !== "group") {
      throw new HttpError(400, "Participants can only be removed from group conversations.");
    }

    const isTarget = participantId === requesterId;
    const isCreator = conversation.createdBy.toString() === requesterId;

    // A member may remove themselves (leave); only the creator may remove others
    if (!isTarget && !isCreator) {
      throw new HttpError(403, "Only the group creator can remove other participants.");
    }

    // Prevent the creator from removing themselves (they should delete the group instead)
    if (isTarget && isCreator) {
      throw new HttpError(
        400,
        "The group creator cannot leave. Delete the conversation instead.",
      );
    }

    const updated = await conversationRepository.removeParticipant(
      conversationId,
      new Types.ObjectId(participantId),
    );
    if (updated) {
      emitParticipantRemoved(conversationId, {
        conversationId,
        participantId,
      });
    }
    return updated;
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async deleteConversation(requesterId: string, conversationId: string) {
    const conversation = await this.getConversationById(requesterId, conversationId);

    if (conversation.createdBy.toString() !== requesterId) {
      throw new HttpError(403, "Only the conversation creator can delete it.");
    }

    const deleted = await conversationRepository.softDeleteById(conversationId);
    if (deleted) {
      emitConversationDeleted(conversationId, { conversationId });
    }
    return deleted;
  }
}
