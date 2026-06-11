import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { sendError, sendSuccess } from "../../common/response";
import { GetNotificationsQuerySchema } from "./notification.schema";
import { NotificationService } from "./notification.service";

export class NotificationController {
  private notificationService = new NotificationService();

  // ── Read ─────────────────────────────────────────────────────────────────────

  /**
   * GET /notifications?page=1&limit=20
   * Returns paginated notifications for the authenticated user, newest first.
   * Also includes the current unread count in meta.
   */
  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = GetNotificationsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const result = await this.notificationService.getNotifications(requesterId, parsed.data);

      sendSuccess(res, 200, "Notifications retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  // ── Mark as read ─────────────────────────────────────────────────────────────

  /**
   * PATCH /notifications/:id/read
   * Marks a single notification as read (recipient only).
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
        sendError(res, 400, "Invalid notification ID.");
        return;
      }

      const notification = await this.notificationService.markAsRead(requesterId, id);

      sendSuccess(res, 200, "Notification marked as read.", notification);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /notifications/read-all
   * Marks all unread notifications as read for the authenticated user.
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const result = await this.notificationService.markAllAsRead(requesterId);

      sendSuccess(res, 200, "All notifications marked as read.", result);
    } catch (error) {
      next(error);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  /**
   * DELETE /notifications/:id
   * Deletes a notification (recipient only).
   */
  deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.authUser?.userId;
      if (!requesterId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const { id } = req.params;
      if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid notification ID.");
        return;
      }

      await this.notificationService.deleteNotification(requesterId, id);

      sendSuccess(res, 200, "Notification deleted successfully.");
    } catch (error) {
      next(error);
    }
  };
}
