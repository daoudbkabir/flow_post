import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

const profileInput = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,32}$/, "Username must be 3–32 characters using letters, numbers, or underscores")
    .nullable()
    .optional(),
  email: z.string().trim().email().max(320).nullable().optional(),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,32}$/, "Enter a valid phone number").nullable().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        timezone: user.timezone,
        loginMethod: user.loginMethod,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn,
      };
    }),
    updateProfile: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
      const updated = await db.updateUserProfile(ctx.user.id, input);
      if (!updated) throw new Error("User profile not found");
      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        username: updated.username,
        phone: updated.phone,
        timezone: updated.timezone,
        loginMethod: updated.loginMethod,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        lastSignedIn: updated.lastSignedIn,
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
