import { TRPCError } from '@trpc/server';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
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

const dateRangeFilter = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const expensesRouter = router({
  getAll: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const baseCondition = eq(expenses.userId, ctx.userId);

    // Constrói as condições de filtro
    const conditions = [baseCondition];
    if (input?.from) {
      conditions.push(gte(expenses.paidAt, input.from));
    }
    if (input?.to) {
      // Adiciona 1 dia para incluir o dia final
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(expenses.paidAt, endDate));
    }

    return await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(expenses.paidAt);
  }),

  getTotal: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const baseCondition = eq(expenses.userId, ctx.userId);

    // Constrói as condições de filtro
    const conditions = [baseCondition];
    if (input?.from) {
      conditions.push(gte(expenses.paidAt, input.from));
    }
    if (input?.to) {
      // Adiciona 1 dia para incluir o dia final
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(expenses.paidAt, endDate));
    }

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(...conditions));

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
