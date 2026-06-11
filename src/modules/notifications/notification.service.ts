import mongoose, { Types } from "mongoose";

import { HttpError } from "../../common/utils/http-error";
import {
  emitNotificationAllRead,
  emitNotificationRead,
  emitNotificationReceived,
} from "./notification.socket";
import type { NotificationType } from "./notification.model";
import { NotificationRepository } from "./notification.repository";
import type { GetNotificationsQueryInput } from "./notification.schema";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  // ── Create ───────────────────────────────────────────────────────────────────

  /**
   * Creates a notification and pushes it to the recipient in real-time.
   * Not an HTTP endpoint — called internally by other services (friends, messages, etc.)
   */
  async createNotification(data: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    type: NotificationType;
    referenceId?: string;
    referenceModel?: string;
  }) {
    const notification = await notificationRepository.create({
      recipientId: new Types.ObjectId(data.recipientId),
      senderId: new Types.ObjectId(data.senderId),
      type: data.type,
      ...(data.referenceId ? { referenceId: new Types.ObjectId(data.referenceId) } : {}),
      ...(data.referenceModel ? { referenceModel: data.referenceModel } : {}),
    });

    emitNotificationReceived(data.recipientId, {
      notificationId: (notification._id as Types.ObjectId).toString(),
      type: data.type,
      senderId: data.senderId,
      senderUsername: data.senderUsername,
      ...(data.referenceId ? { referenceId: data.referenceId } : {}),
      createdAt: notification.createdAt.toISOString(),
    });

    return notification;
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async getNotifications(requesterId: string, query: GetNotificationsQueryInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { notifications, total } = await notificationRepository.findByRecipient(
      new Types.ObjectId(requesterId),
      skip,
      limit,
    );

    const unreadCount = await notificationRepository.countUnread(
      new Types.ObjectId(requesterId),
    );

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Mark as read ─────────────────────────────────────────────────────────────

  async markAsRead(requesterId: string, notificationId: string) {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw new HttpError(400, "Invalid notification ID.");
    }

    const notification = await notificationRepository.markAsRead(
      notificationId,
      new Types.ObjectId(requesterId),
    );

    if (!notification) {
      throw new HttpError(404, "Notification not found or already read.");
    }

    emitNotificationRead(requesterId, notificationId);

    return notification;
  }

  async markAllAsRead(requesterId: string) {
    const modifiedCount = await notificationRepository.markAllAsRead(
      new Types.ObjectId(requesterId),
    );

    if (modifiedCount > 0) {
      emitNotificationAllRead(requesterId);
    }

    return { modifiedCount };
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async deleteNotification(requesterId: string, notificationId: string) {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw new HttpError(400, "Invalid notification ID.");
    }

    const notification = await notificationRepository.deleteById(
      notificationId,
      new Types.ObjectId(requesterId),
    );

    if (!notification) {
      throw new HttpError(404, "Notification not found.");
    }

    return notification;
  }
}
