import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { sendError, sendSuccess } from "../../common/response";
import {
  EditMessageSchema,
  GetMessagesQuerySchema,
  SendMessageSchema,
} from "./message.schema";
import { MessageService } from "./message.service";

export class MessageController {
  private messageService = new MessageService();

  // ── Send ─────────────────────────────────────────────────────────────────────

  /**
   * POST /messages
   * Sends a new message to a conversation the requester belongs to.
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = SendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const message = await this.messageService.sendMessage(requesterId, parsed.data);

      sendSuccess(res, 201, "Message sent successfully.", message);
    } catch (error) {
      next(error);
    }
  };

  // ── Read ─────────────────────────────────────────────────────────────────────

  /**
   * GET /messages?conversationId=:id&page=1&limit=30
   * Returns paginated messages for a conversation (requester must be a member).
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = GetMessagesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const result = await this.messageService.getMessages(requesterId, parsed.data);

      sendSuccess(res, 200, "Messages retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────

  /**
   * PATCH /messages/:id
   * Edits the content of a message (sender only; text messages only).
   */
  editMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid message ID.");
        return;
      }

      const parsed = EditMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const message = await this.messageService.editMessage(requesterId, id, parsed.data);
      if (!message) {
        sendError(res, 404, "Message not found.");
        return;
      }

      sendSuccess(res, 200, "Message updated successfully.", message);
    } catch (error) {
      next(error);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  /**
   * DELETE /messages/:id
   * Soft-deletes a message (sender or conversation creator only).
   */
  deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid message ID.");
        return;
      }

      await this.messageService.deleteMessage(requesterId, id);

      sendSuccess(res, 200, "Message deleted successfully.");
    } catch (error) {
      next(error);
    }
  };

  // ── Mark as read ─────────────────────────────────────────────────────────────

  /**
   * POST /messages/:id/read
   * Marks a message as read by the authenticated user.
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid message ID.");
        return;
      }

      const message = await this.messageService.markAsRead(requesterId, id);
      if (!message) {
        sendError(res, 404, "Message not found.");
        return;
      }

      sendSuccess(res, 200, "Message marked as read.", message);
    } catch (error) {
      next(error);
    }
  };
}
