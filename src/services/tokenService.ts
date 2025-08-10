import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { setCache, getCache, deleteCache } from "./cacheService";
import { type User } from "../db/schema/users";
import { JwtPayload } from "../types";

// Constant prefixes for cache keys
const REFRESH_CACHE_PREFIX = "refresh";
const BLACKLIST_CACHE_PREFIX = "blacklist";

/** Hash a refresh token with SHA-256 */
export const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/** Internal helper: sign a JWT */
const signToken = (payload: JwtPayload, expiresIn: string): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

/** Generate an access token */
export const generateAccessToken = (user: User): string => {
  const payload: JwtPayload = { userId: user.id, email: user.email };
  return signToken(payload, config.JWT_ACCESS_EXPIRES_IN || "15m");
};

/** Generate and store a refresh token in cache */
export const generateRefreshToken = async (user: User): Promise<string> => {
  const payload: JwtPayload = { userId: user.id, email: user.email };
  const refreshToken = signToken(
    payload,
    config.JWT_REFRESH_EXPIRES_IN || "2h"
  );

  const hashed = hashRefreshToken(refreshToken);
  const cacheKey = `${REFRESH_CACHE_PREFIX}:${user.id}`;
  const cacheExpiresIn = 4 * 60 * 60; // 4 hours

  await setCache(cacheKey, hashed, cacheExpiresIn);

  return refreshToken;
};

/** Verify a JWT and return its payload */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
};

/** Check if a token has been blacklisted */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const cacheKey = `${BLACKLIST_CACHE_PREFIX}:${token}`;
  const isBlacklisted = await getCache(cacheKey);
  return Boolean(isBlacklisted);
};

/** Blacklist a token */
export const logoutUser = async (token: string): Promise<void> => {
  const cacheKey = `${BLACKLIST_CACHE_PREFIX}:${token}`;
  await setCache(cacheKey, true, 15 * 60); // 15 minutes
};

/** Check if a refresh token is valid */
export const isRefreshTokenValid = async (token: string): Promise<boolean> => {
  try {
    const payload = verifyToken(token) as JwtPayload;
    const hashedRT = hashRefreshToken(token);

    const cacheKey = `${REFRESH_CACHE_PREFIX}:${payload.userId}`;
    const storedHash = await getCache(cacheKey);

    if (!storedHash) return false;
    return storedHash === hashedRT;
  } catch {
    return false;
  }
};

/** Invalidate a user's refresh token */
export const invalidateRefreshToken = async (userId: number): Promise<void> => {
  const cacheKey = `${REFRESH_CACHE_PREFIX}:${userId}`;
  await deleteCache(cacheKey);
};
