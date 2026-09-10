import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("FlowPost smoke coverage", () => {
  it("exposes a public auth query for logged-out workspace visitors", async () => {
    const ctx = {
      user: undefined,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;

    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("returns a sanitized profile and never exposes the provider identifier", async () => {
    const ctx = {
      user: {
        id: 7,
        openId: "provider-secret-id",
        name: "Creator Example",
        email: "creator@example.com",
        username: "creator_example",
        phone: null,
        timezone: "UTC",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;

    const caller = appRouter.createCaller(ctx);
    const profile = await caller.auth.me();

    expect(profile).toMatchObject({ id: 7, username: "creator_example", timezone: "UTC" });
    expect(profile).not.toHaveProperty("openId");
  });

  it("rejects profile mutations without an authenticated session", async () => {
    const ctx = {
      user: undefined,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;

    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.updateProfile({ name: "Should not write" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("validates profile fields server-side before mutation", async () => {
    const ctx = {
      user: {
        id: 7,
        openId: "provider-secret-id",
        name: "Creator Example",
        email: "creator@example.com",
        username: "creator_example",
        phone: null,
        timezone: "UTC",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;

    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.updateProfile({ username: "x" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
