import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,32}$/, "Enter a valid phone number").nullable().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
}).strict();

const contentStatus = z.enum(["DRAFT", "READY"]);
const contentType = z.enum(["TEXT", "POST", "SCRIPT"]);
const contentFields = {
  title: z.string().trim().min(1).max(200),
  body: z.string().max(100_000),
  status: contentStatus,
  contentType,
};
const contentCreateInput = z.object(contentFields).strict();
const contentIdInput = z.object({ id: z.number().int().positive() }).strict();
const contentUpdateInput = z.object({ id: z.number().int().positive(), ...contentFields }).partial({ title: true, body: true, status: true, contentType: true }).strict().refine(input => Object.keys(input).length > 1, "At least one content field is required");

function isDuplicateUsernameError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; errno?: unknown; sqlMessage?: unknown };
  return candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062 || (typeof candidate.sqlMessage === "string" && candidate.sqlMessage.includes("users_username_unique"));
}

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
      let updated;
      try {
        updated = await db.updateUserProfile(ctx.user.id, input);
      } catch (error) {
        if (isDuplicateUsernameError(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "That username is already taken" });
        }
        throw error;
      }
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
  content: router({
    list: protectedProcedure.query(({ ctx }) => db.listContentForUser(ctx.user.id)),
    get: protectedProcedure.input(contentIdInput).query(async ({ ctx, input }) => {
      const item = await db.getContentForUser(ctx.user.id, input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found" });
      return item;
    }),
    create: protectedProcedure.input(contentCreateInput).mutation(({ ctx, input }) => db.createContent(ctx.user.id, input)),
    update: protectedProcedure.input(contentUpdateInput).mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;
      const item = await db.updateContentForUser(ctx.user.id, id, changes);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found" });
      return item;
    }),
    delete: protectedProcedure.input(contentIdInput).mutation(async ({ ctx, input }) => {
      const deleted = await db.deleteContentForUser(ctx.user.id, input.id);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found" });
      return { success: true } as const;
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
