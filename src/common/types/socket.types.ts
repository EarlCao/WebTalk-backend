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

// ── Messages ──────────────────────────────────────────────────────────────────

export type MessageSentPayload = {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
};

export type MessageEditedPayload = {
  messageId: string;
  conversationId: string;
  content: string;
  editedAt: string;
};

export type MessageDeletedPayload = {
  messageId: string;
  conversationId: string;
};

export type MessageReadPayload = {
  messageId: string;
  conversationId: string;
  readerId: string;
};

// ── Conversations ─────────────────────────────────────────────────────────────

export type ConversationCreatedPayload = {
  conversationId: string;
  type: string;
  name?: string;
  avatar?: string;
  createdBy: string;
  participants: string[];
  createdAt: string;
};

export type ConversationUpdatedPayload = {
  conversationId: string;
  name?: string;
  avatar?: string;
};

export type ParticipantAddedPayload = {
  conversationId: string;
  participantIds: string[];
};

export type ParticipantRemovedPayload = {
  conversationId: string;
  participantId: string;
};

export type ConversationDeletedPayload = {
  conversationId: string;
};

// ── Friends ───────────────────────────────────────────────────────────────────

export type FriendRequestSentPayload = {
  requestId: string;
  requesterId: string;
  requesterUsername: string;
  createdAt: string;
};

export type FriendRequestAcceptedPayload = {
  requestId: string;
  addresseeId: string;
  addresseeUsername: string;
};

export type FriendRequestDeclinedPayload = {
  requestId: string;
};

export type FriendRequestCancelledPayload = {
  requestId: string;
};

export type FriendRemovedPayload = {
  friendshipId: string;
  removedById: string;
};

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserStatusPayload = {
  userId: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen: string;
};

export type UserProfileUpdatedPayload = {
  userId: string;
  username?: string;
  avatar?: string;
  bio?: string;
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
  // Notifications
  notificationReceived: (payload: NotificationSocketPayload) => void;
  notificationRead: (payload: { notificationId: string }) => void;
  notificationAllRead: () => void;
  // Messages
  messageSent: (payload: MessageSentPayload) => void;
  messageEdited: (payload: MessageEditedPayload) => void;
  messageDeleted: (payload: MessageDeletedPayload) => void;
  messageRead: (payload: MessageReadPayload) => void;
  // Conversations
  conversationCreated: (payload: ConversationCreatedPayload) => void;
  conversationUpdated: (payload: ConversationUpdatedPayload) => void;
  participantAdded: (payload: ParticipantAddedPayload) => void;
  participantRemoved: (payload: ParticipantRemovedPayload) => void;
  conversationDeleted: (payload: ConversationDeletedPayload) => void;
  // Friends
  friendRequestSent: (payload: FriendRequestSentPayload) => void;
  friendRequestAccepted: (payload: FriendRequestAcceptedPayload) => void;
  friendRequestDeclined: (payload: FriendRequestDeclinedPayload) => void;
  friendRequestCancelled: (payload: FriendRequestCancelledPayload) => void;
  friendRemoved: (payload: FriendRemovedPayload) => void;
  // Users
  userStatusChanged: (payload: UserStatusPayload) => void;
  userProfileUpdated: (payload: UserProfileUpdatedPayload) => void;
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
