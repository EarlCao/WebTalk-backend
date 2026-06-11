import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { sendError, sendSuccess } from "../../common/response";
import { GetFriendsQuerySchema, SendFriendRequestSchema } from "./friend.schema";
import { FriendService } from "./friend.service";

export class FriendController {
  private friendService = new FriendService();

  // ── Send request ──────────────────────────────────────────────────────────────

  /**
   * POST /friends/requests
   * Sends a friend request to another user.
   */
  sendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = SendFriendRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const request = await this.friendService.sendRequest(requesterId, parsed.data);
      sendSuccess(res, 201, "Friend request sent.", request);
    } catch (error) {
      next(error);
    }
  };

  // ── Incoming requests ─────────────────────────────────────────────────────────

  /**
   * GET /friends/requests/incoming?page=1&limit=20
   * Returns paginated pending requests received by the authenticated user.
   */
  getIncomingRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = GetFriendsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const result = await this.friendService.getIncomingRequests(userId, parsed.data);
      sendSuccess(res, 200, "Incoming friend requests retrieved.", result);
    } catch (error) {
      next(error);
    }
  };

  // ── Outgoing requests ─────────────────────────────────────────────────────────

  /**
   * GET /friends/requests/outgoing?page=1&limit=20
   * Returns paginated pending requests sent by the authenticated user.
   */
  getOutgoingRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = GetFriendsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const result = await this.friendService.getOutgoingRequests(userId, parsed.data);
      sendSuccess(res, 200, "Outgoing friend requests retrieved.", result);
    } catch (error) {
      next(error);
    }
  };

  // ── Accept request ────────────────────────────────────────────────────────────

  /**
   * PATCH /friends/requests/:id/accept
   * Accepts a pending friend request (addressee only).
   */
  acceptRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid request ID.");
        return;
      }

      const request = await this.friendService.acceptRequest(userId, id);
      sendSuccess(res, 200, "Friend request accepted.", request);
    } catch (error) {
      next(error);
    }
  };

  // ── Decline request ───────────────────────────────────────────────────────────

  /**
   * PATCH /friends/requests/:id/decline
   * Declines a pending friend request (addressee only).
   */
  declineRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid request ID.");
        return;
      }

      const request = await this.friendService.declineRequest(userId, id);
      sendSuccess(res, 200, "Friend request declined.", request);
    } catch (error) {
      next(error);
    }
  };

  // ── Cancel request ────────────────────────────────────────────────────────────

  /**
   * DELETE /friends/requests/:id
   * Cancels a pending outgoing request (requester only).
   */
  cancelRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid request ID.");
        return;
      }

      await this.friendService.cancelRequest(userId, id);
      sendSuccess(res, 200, "Friend request cancelled.");
    } catch (error) {
      next(error);
    }
  };

  // ── Friends list ──────────────────────────────────────────────────────────────

  /**
   * GET /friends?page=1&limit=20
   * Returns the authenticated user's accepted friends with pagination.
   */
  getFriends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = GetFriendsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const result = await this.friendService.getFriends(userId, parsed.data);
      sendSuccess(res, 200, "Friends retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  // ── Remove friend ─────────────────────────────────────────────────────────────

  /**
   * DELETE /friends/:id
   * Removes an accepted friendship (either participant may unfriend).
   * :id is the friendship document _id, not the other user's _id.
   */
  removeFriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid friendship ID.");
        return;
      }

      await this.friendService.removeFriend(userId, id);
      sendSuccess(res, 200, "Friend removed successfully.");
    } catch (error) {
      next(error);
    }
  };
}

export const friendController = new FriendController();
