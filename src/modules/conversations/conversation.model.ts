import { Document, Schema, Types, model } from "mongoose";

export type ConversationType = "direct" | "group";

export interface IConversation extends Document {
  type: ConversationType;
  participants: Types.ObjectId[];
  name?: string;           // group conversations only
  avatar?: string;         // group conversations only
  createdBy: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    name: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
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
  }
);

// Speed up "get all conversations for a user" queries
ConversationSchema.index({ participants: 1, deletedAt: 1 });
// Speed up sorting by latest activity
ConversationSchema.index({ lastMessageAt: -1 });

export const ConversationModel = model<IConversation>("Conversation", ConversationSchema);
