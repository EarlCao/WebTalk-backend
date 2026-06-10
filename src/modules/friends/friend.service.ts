import mongoose, { Types } from "mongoose";

import { HttpError } from "../../common/utils/http-error";
import { FriendRepository } from "./friend.repository";
import type { GetFriendsQueryInput, SendFriendRequestInput } from "./friend.schema";

const friendRepository = new FriendRepository();

export class FriendService {
  // ── Send request ──────────────────────────────────────────────────────────────

  /**
   * Sends a friend request from requesterId to data.addresseeId.
   *
   * State machine for pre-existing relationships:
   *   pending  → 409 (already waiting for a response)
   *   accepted → 409 (already friends)
   *   blocked  → 403 (silently refuse without leaking block info)
   *   declined → reset to "pending" (allow re-send after a decline)
   *   none     → create a new request document
   *
   * After a cancel or unfriend the document is soft-deleted, so findBetween
   * won't surface it and a brand-new document will be created.
   */
  async sendRequest(requesterId: string, data: SendFriendRequestInput) {
    if (requesterId === data.addresseeId) {
      throw new HttpError(400, "You cannot send a friend request to yourself.");
    }

    const requesterOid = new Types.ObjectId(requesterId);
    const addresseeOid = new Types.ObjectId(data.addresseeId);

    const existing = await friendRepository.findBetween(requesterOid, addresseeOid);

    if (existing) {
      switch (existing.status) {
        case "accepted":
          throw new HttpError(409, "You are already friends with this user.");

        case "pending":
          throw new HttpError(409, "A friend request already exists between you and this user.");

        case "blocked":
          // Return 403 without revealing who blocked whom
          throw new HttpError(403, "This action is not allowed.");

        case "declined":
          // Re-send: flip the existing declined document back to pending
          return friendRepository.updateStatus(existing._id.toString(), "pending");
      }
    }

    // No active relationship — create a fresh request
    return friendRepository.create({ requesterId: requesterOid, addresseeId: addresseeOid });
  }

  // ── Incoming requests ─────────────────────────────────────────────────────────

  async getIncomingRequests(userId: string, query: GetFriendsQueryInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { requests, total } = await friendRepository.findIncomingRequests(
      new Types.ObjectId(userId),
      skip,
      limit,
    );

    return {
      data: requests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Outgoing requests ─────────────────────────────────────────────────────────

  async getOutgoingRequests(userId: string, query: GetFriendsQueryInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { requests, total } = await friendRepository.findOutgoingRequests(
      new Types.ObjectId(userId),
      skip,
      limit,
    );

    return {
      data: requests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Accept request ────────────────────────────────────────────────────────────

  async acceptRequest(userId: string, requestId: string) {
    if (!mongoose.isValidObjectId(requestId)) {
      throw new HttpError(400, "Invalid request ID.");
    }

    const request = await friendRepository.findById(requestId);
    if (!request) {
      throw new HttpError(404, "Friend request not found.");
    }

    if (request.addresseeId.toString() !== userId) {
      throw new HttpError(403, "You can only accept requests addressed to you.");
    }

    if (request.status !== "pending") {
      throw new HttpError(400, `Cannot accept a request with status "${request.status}".`);
    }

    return friendRepository.updateStatus(requestId, "accepted");
  }

  // ── Decline request ───────────────────────────────────────────────────────────

  async declineRequest(userId: string, requestId: string) {
    if (!mongoose.isValidObjectId(requestId)) {
      throw new HttpError(400, "Invalid request ID.");
    }

    const request = await friendRepository.findById(requestId);
    if (!request) {
      throw new HttpError(404, "Friend request not found.");
    }

    if (request.addresseeId.toString() !== userId) {
      throw new HttpError(403, "You can only decline requests addressed to you.");
    }

    if (request.status !== "pending") {
      throw new HttpError(400, `Cannot decline a request with status "${request.status}".`);
    }

    return friendRepository.updateStatus(requestId, "declined");
  }

  // ── Cancel request ────────────────────────────────────────────────────────────

  /**
   * Soft-deletes a pending outgoing request.
   * Because the document is soft-deleted (not truly removed), the same user can
   * re-send a request later and a new document will be created cleanly.
   */
  async cancelRequest(userId: string, requestId: string) {
    if (!mongoose.isValidObjectId(requestId)) {
      throw new HttpError(400, "Invalid request ID.");
    }

    const request = await friendRepository.findById(requestId);
    if (!request) {
      throw new HttpError(404, "Friend request not found.");
    }

    if (request.requesterId.toString() !== userId) {
      throw new HttpError(403, "You can only cancel your own friend requests.");
    }

    if (request.status !== "pending") {
      throw new HttpError(400, "Only pending requests can be cancelled.");
    }

    return friendRepository.softDeleteById(requestId);
  }

  // ── Friends list ──────────────────────────────────────────────────────────────

  async getFriends(userId: string, query: GetFriendsQueryInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { friends, total } = await friendRepository.findFriends(
      new Types.ObjectId(userId),
      skip,
      limit,
    );

    return {
      data: friends,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Remove friend (unfriend) ──────────────────────────────────────────────────

  /**
   * Soft-deletes an accepted friendship document.
   * Either participant may unfriend; after soft-delete either side can re-add.
   */
  async removeFriend(userId: string, friendshipId: string) {
    if (!mongoose.isValidObjectId(friendshipId)) {
      throw new HttpError(400, "Invalid friendship ID.");
    }

    const friendship = await friendRepository.findById(friendshipId);
    if (!friendship) {
      throw new HttpError(404, "Friendship not found.");
    }

    const isParticipant =
      friendship.requesterId.toString() === userId ||
      friendship.addresseeId.toString() === userId;

    if (!isParticipant) {
      throw new HttpError(403, "You are not part of this friendship.");
    }

    if (friendship.status !== "accepted") {
      throw new HttpError(400, "You can only remove an accepted friendship.");
    }

    return friendRepository.softDeleteById(friendshipId);
  }
}
