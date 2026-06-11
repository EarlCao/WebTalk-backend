import { Document, Schema, Types, model } from "mongoose";

export type NotificationType = "friend_request" | "friend_accepted" | "message";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: NotificationType;
  referenceId?: Types.ObjectId | null;
  referenceModel?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["friend_request", "friend_accepted", "message"],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    referenceModel: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Primary query: all notifications for a recipient, newest first
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
// Fast unread count queries
NotificationSchema.index({ recipientId: 1, isRead: 1 });

export const NotificationModel = model<INotification>("Notification", NotificationSchema);
