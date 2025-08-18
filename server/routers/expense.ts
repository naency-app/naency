import { TRPCError } from '@trpc/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { expenses } from '@/db/schema';
import { protectedProcedure, router } from '../trpc';

const baseExpense = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().int().min(1, 'Amount is required'),
  categoryId: z.string().uuid().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  paidById: z.string().uuid().optional().nullable(),
});

export const expensesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return await db.select().from(expenses).where(eq(expenses.userId, ctx.userId));
  }),

  getTotal: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, ctx.userId));

    return result[0]?.total || 0;
  }),

  create: protectedProcedure.input(baseExpense).mutation(async ({ input, ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const [row] = await db
      .insert(expenses)
      .values({
        userId: ctx.userId,
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
        throw new TRPCError({ code: 'UNAUTHORIZED' });
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
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, ctx.userId)))
        .returning();
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      await db
        .delete(expenses)
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, ctx.userId)));
      return { success: true };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      await db
        .delete(expenses)
        .where(and(inArray(expenses.id, input.ids), eq(expenses.userId, ctx.userId)));
      return { success: true };
    }),
});
