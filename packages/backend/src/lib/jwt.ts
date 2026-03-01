import { sign, verify } from "hono/jwt";

export interface AccessTokenPayload {
  userId: string;
  oauthProvider: string;
  anonymousDisplayId: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

const ACCESS_TOKEN_EXPIRES_IN = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }
  return secret;
}

export async function generateAccessToken(payload: AccessTokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      ...payload,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRES_IN,
    },
    getAccessSecret()
  );
}

export async function generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      ...payload,
      iat: now,
      exp: now + REFRESH_TOKEN_EXPIRES_IN,
    },
    getRefreshSecret()
  );
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const decoded = await verify(token, getAccessSecret(), "HS256");
  return {
    userId: decoded.userId as string,
    oauthProvider: decoded.oauthProvider as string,
    anonymousDisplayId: decoded.anonymousDisplayId as string,
  };
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const decoded = await verify(token, getRefreshSecret(), "HS256");
  return {
    userId: decoded.userId as string,
  };
}
