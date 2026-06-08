export interface AuthTokenPayload {
  userId: string;
  email: string;
  expiresAt?: number;
}
