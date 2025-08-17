import { db } from "@/db/drizzle";
import { protectedProcedure, router } from "../trpc";
import { expenses } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const baseExpense = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().int().min(1, "Amount is required"),
  categoryId: z.string().uuid().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(), 
  paidById: z.string().uuid().optional().nullable(),
});

export const expensesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, ctx.userId));
  }),

  create: protectedProcedure.input(baseExpense).mutation(async ({ input, ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const [row] = await db
      .insert(expenses)
      .values({
        userId: ctx.userId!,
        name: input.name,
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        paidAt: input.paidAt ?? null,
        paidById: input.paidById ?? null,

      })
      .returning();
    return row;
  }),

  update: protectedProcedure
    .input(baseExpense.extend({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const [row] = await db
        .update(expenses)
        .set({
          name: input.name,
          amount: input.amount,
          categoryId: input.categoryId ?? null,
          paidAt: input.paidAt ?? null,
          paidById: input.paidById ?? null,
        })
        .where(
          and(
            eq(expenses.id, input.id),
            eq(expenses.userId, ctx.userId!)
          )
        )
        .returning();
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await db
        .delete(expenses)
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, ctx.userId!))); 
      return { success: true };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      await db
        .delete(expenses)
        .where(and(inArray(expenses.id, input.ids), eq(expenses.userId, ctx.userId!)));
      return { success: true };
    }),
});
