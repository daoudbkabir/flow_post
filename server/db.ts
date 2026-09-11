import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertContentItem, InsertUser, contentItems, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "username", "phone", "timezone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized as never;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  id: number,
  profile: Partial<Pick<InsertUser, "name" | "username" | "phone" | "timezone">>
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  const changes = Object.fromEntries(
    Object.entries(profile).filter(([, value]) => value !== undefined),
  );
  await db.update(users).set({ ...changes, updatedAt: new Date() }).where(eq(users.id, id));
  return getUserById(id);
}

export type ContentInput = Pick<InsertContentItem, "title" | "body" | "status" | "contentType">;
export type ContentUpdate = Partial<ContentInput>;

export async function createContent(userId: number, input: ContentInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(contentItems).values({ userId, ...input });
  return getContentForUser(userId, Number(result[0].insertId));
}

export async function listContentForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(contentItems).where(eq(contentItems.userId, userId)).orderBy(desc(contentItems.updatedAt));
}

export async function getContentForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.select().from(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.userId, userId))).limit(1);
  return result[0];
}

export async function updateContentForUser(userId: number, id: number, input: ContentUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  await db.update(contentItems).set({ ...changes, updatedAt: new Date() }).where(and(eq(contentItems.id, id), eq(contentItems.userId, userId)));
  return getContentForUser(userId, id);
}

export async function deleteContentForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.delete(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.userId, userId)));
  return Number(result[0].affectedRows ?? 0) > 0;
}

// TODO: add feature queries here as your schema grows.
