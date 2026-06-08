export type ClientToServerEvents = {
  ping: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
};

export type ServerToClientEvents = {
  pong: () => void;
  userConnected: (payload: SocketUserPayload) => void;
  userDisconnected: (payload: SocketUserPayload) => void;
  messageReceived: (payload: MessageReceivedPayload) => void;
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
