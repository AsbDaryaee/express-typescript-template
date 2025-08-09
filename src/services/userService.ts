import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { users, type User } from "../db/schema/users";
import {
  setCache,
  getCache,
  generateUserCacheKey,
  deleteCache,
} from "./cacheService";
import { publishUserEvent } from "./queueService";

export const getUserById = async (id: number): Promise<User | null> => {
  // Try cache first
  const cacheKey = generateUserCacheKey(id);
  const cachedUser = await getCache<User>(cacheKey);

  if (cachedUser) {
    return cachedUser;
  }

  // Fetch from database
  const [user] = await db.select().from(users).where(eq(users.id, id));

  if (user) {
    // Cache for 1 hour
    await setCache(cacheKey, user, 3600);
    return user;
  }

  return null;
};

export const updateUser = async (
  id: number,
  updates: Partial<User>
): Promise<User | null> => {
  const [updatedUser] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (updatedUser) {
    // Update cache
    const cacheKey = generateUserCacheKey(id);
    await setCache(cacheKey, updatedUser, 3600);

    // Publish event
    await publishUserEvent("user.updated", id, updates);

    return updatedUser;
  }

  return null;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (deletedUser) {
    // Remove from cache
    const cacheKey = generateUserCacheKey(id);
    await deleteCache(cacheKey);

    // Publish event
    await publishUserEvent("user.deleted", id, {});

    return true;
  }

  return false;
};

export const getAllUsers = async (
  limit: number = 50,
  offset: number = 0
): Promise<User[]> => {
  return db.select().from(users).limit(limit).offset(offset);
};
