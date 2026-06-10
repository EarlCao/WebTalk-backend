import { Types } from "mongoose";

import { FriendModel, FriendRequestStatus, IFriend } from "./friend.model";

const ACTIVE_FILTER = { deletedAt: null } as const;

export class FriendRepository {
  // ── Create ────────────────────────────────────────────────────────────────────

  async create(data: {
    requesterId: Types.ObjectId;
    addresseeId: Types.ObjectId;
  }): Promise<IFriend> {
    return FriendModel.create(data);
  }

  // ── Read ──────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<IFriend | null> {
    return FriendModel.findOne({ _id: id, ...ACTIVE_FILTER }).exec();
  }

  /**
   * Find an active friendship/request between two users regardless of direction.
   * Used to enforce uniqueness and detect duplicate requests in the service layer.
   */
  async findBetween(
    userAId: Types.ObjectId,
    userBId: Types.ObjectId,
  ): Promise<IFriend | null> {
    return FriendModel.findOne({
      $or: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId },
      ],
      ...ACTIVE_FILTER,
    }).exec();
  }

  /**
   * Paginated pending requests received by a user (they are the addressee).
   */
  async findIncomingRequests(
    userId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<{ requests: IFriend[]; total: number }> {
    const filter = { addresseeId: userId, status: "pending", ...ACTIVE_FILTER };

    const [requests, total] = await Promise.all([
      FriendModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requesterId", "username avatar status")
        .exec(),
      FriendModel.countDocuments(filter).exec(),
    ]);

    return { requests, total };
  }

  /**
   * Paginated pending requests sent by a user (they are the requester).
   */
  async findOutgoingRequests(
    userId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<{ requests: IFriend[]; total: number }> {
    const filter = { requesterId: userId, status: "pending", ...ACTIVE_FILTER };

    const [requests, total] = await Promise.all([
      FriendModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("addresseeId", "username avatar status")
        .exec(),
      FriendModel.countDocuments(filter).exec(),
    ]);

    return { requests, total };
  }

  /**
   * Paginated accepted friends for a user (either as requester or addressee).
   * Both sides are populated so the caller can resolve the "other" user.
   */
  async findFriends(
    userId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<{ friends: IFriend[]; total: number }> {
    const filter = {
      $or: [{ requesterId: userId }, { addresseeId: userId }],
      status: "accepted",
      ...ACTIVE_FILTER,
    };

    const [friends, total] = await Promise.all([
      FriendModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requesterId", "username avatar status lastSeen")
        .populate("addresseeId", "username avatar status lastSeen")
        .exec(),
      FriendModel.countDocuments(filter).exec(),
    ]);

    return { friends, total };
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: FriendRequestStatus): Promise<IFriend | null> {
    return FriendModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: { status } },
      { new: true },
    )
      .populate("requesterId", "username avatar status")
      .populate("addresseeId", "username avatar status")
      .exec();
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async softDeleteById(id: string): Promise<IFriend | null> {
    return FriendModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }
}
