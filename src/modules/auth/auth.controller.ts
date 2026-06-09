import type { NextFunction, Request, Response } from "express";

import { sendSuccess, sendError } from "../../common/response";
import { RegisterSchema, LoginSchema } from "./auth.schema";
import { AuthService } from "./auth.service";

export class AuthController {
  private authService = new AuthService();

  /**
   * POST /auth/register
   * Creates a new user account and returns a JWT.
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const { token, user } = await this.authService.register(parsed.data);

      sendSuccess(res, 201, "Account created successfully.", { token, user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/login
   * Authenticates the user and returns a JWT.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Validation failed.", parsed.error.flatten());
        return;
      }

      const { token, user } = await this.authService.login(parsed.data);

      sendSuccess(res, 200, "Logged in successfully.", { token, user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/logout
   * Blacklists the current JWT so it can no longer be used.
   * Requires a valid Bearer token via authMiddleware.
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.authToken;
      const expiresAt = req.authUser?.expiresAt;

      if (!token) {
        sendError(res, 401, "No active session found.");
        return;
      }

      this.authService.logout(token, expiresAt);

      sendSuccess(res, 200, "Logged out successfully.");
    } catch (error) {
      next(error);
    }
  };
}
