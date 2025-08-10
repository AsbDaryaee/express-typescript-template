import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { users, type User, type NewUser } from "../db/schema/users";

/** Hash a plaintext password */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/** Compare plaintext and hashed passwords */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/** Create a new user in the database with hashed password */
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

/** Generic user finder by field */
export const findUserByField = async (
  field: "email" | "id",
  value: any
): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users[field], value));
  return user;
};

/** Find user by email */
export const findUserByEmail = (email: string) =>
  findUserByField("email", email);

/** Find user by id */
export const findUserById = (id: number) => findUserByField("id", id);

/** Authenticate credentials */
export const authenticateUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isMatch = await comparePassword(password, user.password);
  return isMatch ? user : null;
};
