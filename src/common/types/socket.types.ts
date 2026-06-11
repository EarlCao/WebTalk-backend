// ── Notification ──────────────────────────────────────────────────────────────

export type NotificationType = "friend_request" | "friend_accepted" | "message";

export type NotificationSocketPayload = {
  notificationId: string;
  type: NotificationType;
  senderId: string;
  senderUsername: string;
  referenceId?: string;
  createdAt: string;
};

// ── Client → Server events ────────────────────────────────────────────────────

export type ClientToServerEvents = {
  ping: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
};

// ── Server → Client events ────────────────────────────────────────────────────

export type ServerToClientEvents = {
  pong: () => void;
  userConnected: (payload: SocketUserPayload) => void;
  userDisconnected: (payload: SocketUserPayload) => void;
  messageReceived: (payload: MessageReceivedPayload) => void;
  notificationReceived: (payload: NotificationSocketPayload) => void;
  notificationRead: (payload: { notificationId: string }) => void;
  notificationAllRead: () => void;
};

export type InterServerEvents = Record<string, never>;

export type SocketData = {
  userId?: string;
  email?: string;
};

export type SocketUserPayload = {
  socketId: string;
  userId?: string;
  email?: string;
};

export type SendMessagePayload = {
  roomId: string;
  message: string;
};

export type MessageReceivedPayload = SendMessagePayload & {
  socketId: string;
  sentAt: string;
};
