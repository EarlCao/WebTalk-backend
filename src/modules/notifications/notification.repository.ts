import { Types } from "mongoose";

import { INotification, NotificationModel, NotificationType } from "./notification.model";

export class NotificationRepository {
  // ── Create ───────────────────────────────────────────────────────────────────

  async create(data: {
    recipientId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: NotificationType;
    referenceId?: Types.ObjectId;
    referenceModel?: string;
  }): Promise<INotification> {
    return NotificationModel.create(data);
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<INotification | null> {
    return NotificationModel.findById(id).exec();
  }

  async findByRecipient(
    recipientId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<{ notifications: INotification[]; total: number }> {
    const filter = { recipientId };

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "username avatar")
        .exec(),
      NotificationModel.countDocuments(filter).exec(),
    ]);

    return { notifications, total };
  }

  async countUnread(recipientId: Types.ObjectId): Promise<number> {
    return NotificationModel.countDocuments({ recipientId, isRead: false }).exec();
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async markAsRead(id: string, recipientId: Types.ObjectId): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, recipientId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    ).exec();
  }

  async markAllAsRead(recipientId: Types.ObjectId): Promise<number> {
    const result = await NotificationModel.updateMany(
      { recipientId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    ).exec();

    return result.modifiedCount;
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async deleteById(id: string, recipientId: Types.ObjectId): Promise<INotification | null> {
    return NotificationModel.findOneAndDelete({ _id: id, recipientId }).exec();
  }
}
