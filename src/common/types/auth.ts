export interface AuthTokenPayload {
  userId: number;
  email: string;
  expiresAt?: number;
}