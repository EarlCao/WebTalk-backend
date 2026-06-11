import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";

import { env } from "../../config/env";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socket.types";
import type { AuthTokenPayload } from "../types/auth";
import { authTokenBlacklist } from "../utils/auth-token-blacklist";

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const isValidPayload = (
  payload: string | jwt.JwtPayload,
): payload is jwt.JwtPayload & AuthTokenPayload =>
  typeof payload !== "string" &&
  typeof payload.userId === "string" &&
  payload.userId.length > 0 &&
  typeof payload.email === "string" &&
  payload.email.length > 0;

/**
 * Extracts a Bearer token from a Socket.IO handshake.
 * Supports the recommended `auth.token` field as well as a standard
 * `Authorization: Bearer <token>` header, for client flexibility.
 */
const getHandshakeToken = (socket: AppSocket): string | null => {
  const authToken = socket.handshake.auth?.["token"];
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers.authorization;
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

/**
 * Socket.IO middleware that authenticates the connecting client via JWT.
 *
 * Sets `socket.data.userId` / `socket.data.email` when a valid, non-blacklisted
 * token is provided. This is REQUIRED for `registerUserSocketHandlers` to join
 * the user into their private `userId` room, which every targeted real-time
 * event (notifications, friend events, conversation/message events, profile
 * updates) relies on for delivery.
 *
 * The connection is intentionally NOT rejected when no/invalid token is
 * provided, so anonymous clients can still use unauthenticated features
 * (e.g. the public "ping"/"joinRoom" handlers). They simply won't be joined
 * into a private room and won't receive user-scoped events.
 */
export const socketAuthMiddleware = (socket: AppSocket, next: (err?: Error) => void): void => {
  const token = getHandshakeToken(socket);

  if (!token || authTokenBlacklist.isTokenBlacklisted(token)) {
    next();
    return;
  }

  try {
    const decodedToken = jwt.verify(token, env.JWT_SECRET);

    if (isValidPayload(decodedToken)) {
      socket.data.userId = decodedToken.userId;
      socket.data.email = decodedToken.email;
    }
  } catch {
    // Invalid/expired token — proceed unauthenticated rather than rejecting
    // the whole connection.
  }

  next();
};
