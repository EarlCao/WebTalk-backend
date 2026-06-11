import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { sendError, sendSuccess } from "../../common/response";
import {
  AddParticipantsSchema,
  CreateDirectConversationSchema,
  CreateGroupConversationSchema,
  GetConversationsQuerySchema,
  RemoveParticipantSchema,
  UpdateGroupConversationSchema,
} from "./conversation.schema";
import { ConversationService } from "./conversation.service";

export class ConversationController {
  private conversationService = new ConversationService();

  // ── Create ──────────────────────────────────────────────────────────────────

  /**
   * POST /conversations/direct
   * Creates (or returns an existing) direct 1-to-1 conversation.
   */
  createDirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = CreateDirectConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const conversation = await this.conversationService.createDirectConversation(
        requesterId,
        parsed.data,
      );

      sendSuccess(res, 201, "Direct conversation ready.", conversation);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/group
   * Creates a new group conversation.
   */
  createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = CreateGroupConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const conversation = await this.conversationService.createGroupConversation(
        requesterId,
        parsed.data,
      );

      sendSuccess(res, 201, "Group conversation created successfully.", conversation);
    } catch (error) {
      next(error);
    }
  };

  // ── Read ─────────────────────────────────────────────────────────────────────

  /**
   * GET /conversations
   * Returns all conversations the authenticated user is part of (paginated).
   */
  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = GetConversationsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const result = await this.conversationService.getConversations(requesterId, parsed.data);

      sendSuccess(res, 200, "Conversations retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /conversations/:id
   * Returns a single conversation by ID (requester must be a participant).
   */
  getConversationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid conversation ID.");
        return;
      }

      const conversation = await this.conversationService.getConversationById(requesterId, id);

      sendSuccess(res, 200, "Conversation retrieved successfully.", conversation);
    } catch (error) {
      next(error);
    }
  };

  // ── Update (group only) ───────────────────────────────────────────────────────

  /**
   * PATCH /conversations/:id
   * Updates name / avatar of a group conversation (members only).
   */
  updateGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid conversation ID.");
        return;
      }

      const parsed = UpdateGroupConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const conversation = await this.conversationService.updateGroupConversation(
        requesterId,
        id,
        parsed.data,
      );

      sendSuccess(res, 200, "Group conversation updated successfully.", conversation);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/:id/participants
   * Adds one or more participants to a group conversation (members only).
   */
  addParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid conversation ID.");
        return;
      }

      const parsed = AddParticipantsSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const conversation = await this.conversationService.addParticipants(
        requesterId,
        id,
        parsed.data,
      );

      sendSuccess(res, 200, "Participants added successfully.", conversation);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /conversations/:id/participants/:participantId
   * Removes a participant from a group conversation.
   * Members may remove themselves (leave); only the creator can remove others.
   */
  removeParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id, participantId } = req.params;

      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid conversation ID.");
        return;
      }

      const parsed = RemoveParticipantSchema.safeParse({ participantId });
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const conversation = await this.conversationService.removeParticipant(
        requesterId,
        id,
        parsed.data.participantId,
      );

      sendSuccess(res, 200, "Participant removed successfully.", conversation);
    } catch (error) {
      next(error);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  /**
   * DELETE /conversations/:id
   * Soft-deletes a conversation (creator only).
   */
  deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid conversation ID.");
        return;
      }

      await this.conversationService.deleteConversation(requesterId, id);

      sendSuccess(res, 200, "Conversation deleted successfully.");
    } catch (error) {
      next(error);
    }
  };
}

export const conversationController = new ConversationController();
