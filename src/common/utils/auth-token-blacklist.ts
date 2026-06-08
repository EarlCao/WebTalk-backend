const cleanupExpiredTokens = (blacklistedTokens: Map<string, number | null>): void => {
  const now = Date.now();

  for (const [token, expiresAtInMs] of blacklistedTokens.entries()) {
    if (expiresAtInMs !== null && expiresAtInMs <= now) {
      blacklistedTokens.delete(token);
    }
  }
};

class AuthTokenBlacklist {
  private readonly blacklistedTokens = new Map<string, number | null>();

  blacklistToken(token: string, expiresAtUnixSeconds?: number): void {
    cleanupExpiredTokens(this.blacklistedTokens);

    const expiresAtInMs = typeof expiresAtUnixSeconds === "number"
      ? expiresAtUnixSeconds * 1000
      : null;

    this.blacklistedTokens.set(token, expiresAtInMs);
  }

  isTokenBlacklisted(token: string): boolean {
    cleanupExpiredTokens(this.blacklistedTokens);

    const expiresAtInMs = this.blacklistedTokens.get(token);

    if (expiresAtInMs === undefined) {
      return false;
    }

    if (expiresAtInMs !== null && expiresAtInMs <= Date.now()) {
      this.blacklistedTokens.delete(token);
      return false;
    }

    return true;
  }
}

export const authTokenBlacklist = new AuthTokenBlacklist();