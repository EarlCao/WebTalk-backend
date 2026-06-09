import { Document, Schema, Types, model } from "mongoose";

export type MessageType = "text" | "image" | "file" | "system";

export interface IAttachment {
  url: string;
  name: string;
  size: number;        // bytes
  mimeType: string;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: MessageType;
  attachments: IAttachment[];
  readBy: Types.ObjectId[];
  editedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false },
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Fetch messages for a conversation, sorted by newest first
MessageSchema.index({ conversationId: 1, createdAt: -1 });
// Speed up sender-based queries (edit / delete ownership checks)
MessageSchema.index({ senderId: 1 });

export const MessageModel = model<IMessage>("Message", MessageSchema);
