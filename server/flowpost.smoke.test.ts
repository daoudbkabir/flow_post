import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { User } from "../drizzle/schema";
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FlowPost auth and profile coverage", () => {
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
});

export {};
