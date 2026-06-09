import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { sendError, sendSuccess } from "../../common/response";
import { SearchUsersQuerySchema, UpdateProfileSchema } from "./user.schema";
import { UserService } from "./user.service";

export class UserController {
  private userService = new UserService();

  /**
   * GET /users/me
   * Returns the authenticated user's profile.
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const user = await this.userService.getUserProfile(userId);
      if (!user) {
        sendError(res, 404, "User not found.");
        return;
      }

      sendSuccess(res, 200, "User profile retrieved successfully.", user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /users/me
   * Updates the authenticated user's profile.
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const parsed = UpdateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      if (Object.keys(parsed.data).length === 0) {
        sendError(res, 400, "No fields provided for update.");
        return;
      }

      const user = await this.userService.updateUserProfile(userId, parsed.data);
      if (!user) {
        sendError(res, 404, "User not found.");
        return;
      }

      sendSuccess(res, 200, "Profile updated successfully.", user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /users/me
   * Soft-deletes the authenticated user's account (sets deletedAt).
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authUser?.userId;
      if (!userId) {
        sendError(res, 401, "Unauthorized.");
        return;
      }

      const user = await this.userService.softDeleteUser(userId);
      if (!user) {
        sendError(res, 404, "User not found.");
        return;
      }

      sendSuccess(res, 200, "Account deleted successfully.");
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users
   * Searches active users with optional username filter and pagination.
   */
  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = SearchUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, "Invalid query parameters.", parsed.error.flatten());
        return;
      }

      const { username, page, limit } = parsed.data;
      const result = await this.userService.searchUsers(username, page, limit);

      sendSuccess(res, 200, "Users retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users/:id
   * Returns a single active user by MongoDB ObjectId.
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // !id narrows out undefined (noUncheckedIndexedAccess), isValidObjectId rejects malformed strings
      if (!id || !mongoose.isValidObjectId(id)) {
        sendError(res, 400, "Invalid user ID.");
        return;
      }

      const user = await this.userService.getUserById(id);
      if (!user) {
        sendError(res, 404, "User not found.");
        return;
      }

      sendSuccess(res, 200, "User retrieved successfully.", user);
    } catch (error) {
      next(error);
    }
  };
}
