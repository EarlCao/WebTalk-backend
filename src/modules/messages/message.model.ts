import { Document, Schema, Types, model } from "mongoose";

export type MessageType = "text" | "system";

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: MessageType;
  readBy: Types.ObjectId[];
  editedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

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
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["text", "system"],
      default: "text",
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
