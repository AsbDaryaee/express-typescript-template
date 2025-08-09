import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { users, type User, type NewUser } from "../db/schema/users";

import { config } from "../config";
import { JwtPayload } from "../types";
import { getCache, setCache } from "./cacheService";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
};

export const createUser = async (
  userData: Omit<NewUser, "password"> & { password: string }
): Promise<User> => {
  const hashedPassword = await hashPassword(userData.password);

  const [user] = await db
    .insert(users)
    .values({
      ...userData,
      password: hashedPassword,
    })
    .returning();

  return user;
};

export const findUserByEmail = async (
  email: string
): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
};

export const findUserById = async (id: number): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  const user = await findUserByEmail(email);
  if (!user || !(await comparePassword(password, user.password))) {
    return null;
  }
  return user;
};

export const logoutUser = async (token: string): Promise<void> => {
  const cacheKey = `blacklist:${token}`;
  await setCache(cacheKey, true, 3600);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const cacheKey = `blacklist:${token}`;
  const blacklistToken = await getCache(cacheKey);

  return Boolean(blacklistToken);
};
