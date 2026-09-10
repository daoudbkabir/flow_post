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
    await expect(caller.auth.me()).resolves.toBeUndefined();
  });
});
