import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { sendError } from "../response";
import type { AuthTokenPayload } from "../types/auth";
import { authTokenBlacklist } from "../utils/auth-token-blacklist";

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const isValidPayload = (
  payload: string | jwt.JwtPayload,
): payload is jwt.JwtPayload & AuthTokenPayload =>
  typeof payload !== "string" &&
  typeof payload.userId === "string" &&
  payload.userId.length > 0 &&
  typeof payload.email === "string" &&
  payload.email.length > 0;

export const authMiddleware = (request: Request, response: Response, next: NextFunction): void => {
  const token = getBearerToken(request.headers.authorization);

  if (!token) {
    sendError(response, 401, "Authentication token is missing or invalid.");
    return;
  }

  if (authTokenBlacklist.isTokenBlacklisted(token)) {
    sendError(response, 401, "Authentication token has already been logged out.");
    return;
  }

  try {
    const decodedToken = jwt.verify(token, env.JWT_SECRET);

    if (!isValidPayload(decodedToken)) {
      sendError(response, 401, "Authentication token payload is invalid.");
      return;
    }

    request.authUser = typeof decodedToken.exp === "number"
      ? {
          userId: decodedToken.userId,
          email: decodedToken.email,
          expiresAt: decodedToken.exp,
        }
      : {
          userId: decodedToken.userId,
          email: decodedToken.email,
        };
    request.authToken = token;

    next();
  } catch {
    sendError(response, 401, "Authentication failed.");
  }
};
