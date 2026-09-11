import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { ContentItem, User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

function createUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 7,
    openId: "provider-secret-id",
    name: "Creator Example",
    email: "creator@example.com",
    username: "creator_example",
    phone: null,
    timezone: "UTC",
    loginMethod: "manus",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    ...overrides,
  };
}

function createContext(user?: User): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createContent(overrides: Partial<ContentItem> = {}): ContentItem {
  const now = new Date();
  return {
    id: 101,
    userId: 7,
    title: "Recovery is not laziness",
    body: "A short draft body.",
    status: "DRAFT",
    contentType: "POST",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FlowPost auth, profile, and content ownership coverage", () => {
  it("exposes a public auth query for logged-out workspace visitors", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("returns a sanitized profile and never exposes the provider identifier", async () => {
    const caller = appRouter.createCaller(createContext(createUser()));
    const profile = await caller.auth.me();

    expect(profile).toMatchObject({ id: 7, username: "creator_example", timezone: "UTC" });
    expect(profile).not.toHaveProperty("openId");
  });

  it("updates only the authenticated user's profile and preserves omitted fields", async () => {
    const currentUser = createUser({ id: 42, username: "private_creator", phone: "+880 1700 000000" });
    const updateSpy = vi.spyOn(db, "updateUserProfile").mockImplementation(async (id, profile) => {
      expect(id).toBe(42);
      return createUser({ ...currentUser, ...profile, id, updatedAt: new Date() });
    });
    const caller = appRouter.createCaller(createContext(currentUser));

    const updated = await caller.auth.updateProfile({ name: "Updated Creator" });

    expect(updateSpy).toHaveBeenCalledWith(42, { name: "Updated Creator" });
    expect(updated).toMatchObject({ id: 42, name: "Updated Creator", username: "private_creator", phone: "+880 1700 000000" });
  });

  it("does not accept an arbitrary frontend userId", async () => {
    const updateSpy = vi.spyOn(db, "updateUserProfile");
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    await expect(caller.auth.updateProfile({ name: "Should not redirect", userId: 99 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("returns a controlled conflict when a username is already taken", async () => {
    vi.spyOn(db, "updateUserProfile").mockRejectedValue({ code: "ER_DUP_ENTRY", errno: 1062 });
    const caller = appRouter.createCaller(createContext(createUser()));

    await expect(caller.auth.updateProfile({ username: "taken_name" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "That username is already taken",
    });
  });

  it("rejects email changes because email is provider-controlled", async () => {
    const updateSpy = vi.spyOn(db, "updateUserProfile");
    const caller = appRouter.createCaller(createContext(createUser()));

    await expect(caller.auth.updateProfile({ email: "new@example.com" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("rejects profile mutations without an authenticated session", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.auth.updateProfile({ name: "Should not write" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("validates profile fields server-side before mutation", async () => {
    const caller = appRouter.createCaller(createContext(createUser()));
    await expect(caller.auth.updateProfile({ username: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates a draft for the authenticated owner", async () => {
    const createSpy = vi.spyOn(db, "createContent").mockImplementation(async (userId, input) => createContent({ userId, ...input }));
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    const item = await caller.content.create({ title: "My first draft", body: "A useful idea.", status: "DRAFT", contentType: "POST" });

    expect(createSpy).toHaveBeenCalledWith(42, { title: "My first draft", body: "A useful idea.", status: "DRAFT", contentType: "POST" });
    expect(item.userId).toBe(42);
  });

  it("lists only content for the authenticated owner", async () => {
    const listSpy = vi.spyOn(db, "listContentForUser").mockImplementation(async userId => [createContent({ userId })]);
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    const items = await caller.content.list();

    expect(listSpy).toHaveBeenCalledWith(42);
    expect(items).toHaveLength(1);
    expect(items[0]?.userId).toBe(42);
  });

  it("retrieves content owned by the authenticated user", async () => {
    const getSpy = vi.spyOn(db, "getContentForUser").mockResolvedValue(createContent({ id: 101, userId: 42 }));
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    const item = await caller.content.get({ id: 101 });

    expect(getSpy).toHaveBeenCalledWith(42, 101);
    expect(item.userId).toBe(42);
  });

  it("does not reveal another user's content through get", async () => {
    const getSpy = vi.spyOn(db, "getContentForUser").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    await expect(caller.content.get({ id: 101 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(getSpy).toHaveBeenCalledWith(42, 101);
  });

  it("updates content only through the authenticated owner scope", async () => {
    const updateSpy = vi.spyOn(db, "updateContentForUser").mockResolvedValue(createContent({ id: 101, userId: 42, title: "Updated title" }));
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    const item = await caller.content.update({ id: 101, title: "Updated title" });

    expect(updateSpy).toHaveBeenCalledWith(42, 101, { title: "Updated title" });
    expect(item.title).toBe("Updated title");
  });

  it("does not update another user's content", async () => {
    const updateSpy = vi.spyOn(db, "updateContentForUser").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    await expect(caller.content.update({ id: 202, title: "Should not change" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(updateSpy).toHaveBeenCalledWith(42, 202, { title: "Should not change" });
  });

  it("deletes only content owned by the authenticated user", async () => {
    const deleteSpy = vi.spyOn(db, "deleteContentForUser").mockResolvedValue(true);
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    await expect(caller.content.delete({ id: 101 })).resolves.toEqual({ success: true });
    expect(deleteSpy).toHaveBeenCalledWith(42, 101);
  });

  it("does not delete another user's content", async () => {
    const deleteSpy = vi.spyOn(db, "deleteContentForUser").mockResolvedValue(false);
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    await expect(caller.content.delete({ id: 202 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(deleteSpy).toHaveBeenCalledWith(42, 202);
  });

  it("rejects unauthenticated content access", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.content.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.create({ title: "Nope", body: "Nope", status: "DRAFT", contentType: "TEXT" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.get({ id: 101 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.update({ id: 101, title: "Nope" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.delete({ id: 101 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects invalid create input before reaching the database", async () => {
    const createSpy = vi.spyOn(db, "createContent");
    const caller = appRouter.createCaller(createContext(createUser()));

    await expect(caller.content.create({ title: "", body: "Body", status: "DRAFT", contentType: "VIDEO" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("rejects a client-supplied content owner", async () => {
    const createSpy = vi.spyOn(db, "createContent");
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    await expect(caller.content.create({ title: "No owner override", body: "Body", status: "DRAFT", contentType: "TEXT", userId: 99 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("rejects invalid update input before reaching the database", async () => {
    const updateSpy = vi.spyOn(db, "updateContentForUser");
    const caller = appRouter.createCaller(createContext(createUser()));

    await expect(caller.content.update({ id: 101, status: "PUBLISHED" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("preserves unspecified fields during a partial update", async () => {
    const updateSpy = vi.spyOn(db, "updateContentForUser").mockResolvedValue(createContent({ title: "New title", body: "Original body", status: "DRAFT", contentType: "SCRIPT" }));
    const caller = appRouter.createCaller(createContext(createUser({ id: 42 })));

    const item = await caller.content.update({ id: 101, title: "New title" });

    expect(updateSpy).toHaveBeenCalledWith(42, 101, { title: "New title" });
    expect(item).toMatchObject({ title: "New title", body: "Original body", status: "DRAFT", contentType: "SCRIPT" });
  });
});

export {};
