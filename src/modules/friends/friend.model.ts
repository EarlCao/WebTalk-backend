import { Document, Schema, Types, model } from "mongoose";

export type FriendRequestStatus = "pending" | "accepted" | "declined" | "blocked";

export interface IFriend extends Document {
  requesterId: Types.ObjectId;
  addresseeId: Types.ObjectId;
  status: FriendRequestStatus;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<IFriend>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addresseeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
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

// Prevent duplicate active requests between the same pair.
// partialFilterExpression means soft-deleted records are excluded from the constraint,
// so users can re-send after a cancel/unfriend.
FriendSchema.index(
  { requesterId: 1, addresseeId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

// Speed up look-ups scoped to one side of the relationship
FriendSchema.index({ addresseeId: 1, status: 1, deletedAt: 1 });
FriendSchema.index({ requesterId: 1, status: 1, deletedAt: 1 });

export const FriendModel = model<IFriend>("Friend", FriendSchema);
