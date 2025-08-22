import { TRPCError } from '@trpc/server';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { categories, incomes } from '@/db/schema';
import { protectedProcedure, router } from '../trpc';

const baseIncome = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().int().min(1, 'Amount is required'),
  categoryId: z.string().uuid().optional().nullable(),
  receivedAt: z.coerce.date().optional().nullable(),
  receivingAccountId: z.string().uuid().optional().nullable(),
});

const dateRangeFilter = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const incomesRouter = router({
  getAll: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const baseCondition = eq(incomes.userId, ctx.userId);
    const conditions = [baseCondition];

    if (input?.from) {
      conditions.push(gte(incomes.receivedAt, input.from));
    }
    if (input?.to) {
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1); // incluir o dia final
      conditions.push(lte(incomes.receivedAt, endDate));
    }

    return await db
      .select()
      .from(incomes)
      .where(and(...conditions))
      .orderBy(incomes.receivedAt);
  }),

  getTotal: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const baseCondition = eq(incomes.userId, ctx.userId);
    const conditions = [baseCondition];

    if (input?.from) {
      conditions.push(gte(incomes.receivedAt, input.from));
    }
    if (input?.to) {
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1); // incluir o dia final
      conditions.push(lte(incomes.receivedAt, endDate));
    }

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${incomes.amount}), 0)`,
      })
      .from(incomes)
      .where(and(...conditions));

    return result[0]?.total || 0;
  }),

  create: protectedProcedure.input(baseIncome).mutation(async ({ input, ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // valida categoria: precisa existir e ser flow='income'
    if (input.categoryId) {
      const cat = await db
        .select({ id: categories.id, flow: categories.flow })
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.userId, ctx.userId)));

      if (cat.length === 0 || cat[0].flow !== 'income') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid category for income.' });
      }
    }

    const [row] = await db
      .insert(incomes)
      .values({
        userId: ctx.userId,
        description: input.description,
        amount: input.amount,
        receivedAt: input.receivedAt ?? new Date(),
        receivingAccountId: input.receivingAccountId ?? null,
        categoryId: input.categoryId ?? null,
      })
      .returning();

    return row;
  }),

  update: protectedProcedure
    .input(baseIncome.extend({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // valida categoria: precisa existir e ser flow='income' (quando enviada)
      if (input.categoryId) {
        const cat = await db
          .select({ id: categories.id, flow: categories.flow })
          .from(categories)
          .where(and(eq(categories.id, input.categoryId), eq(categories.userId, ctx.userId)));

        if (cat.length === 0 || cat[0].flow !== 'income') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid category for income.' });
        }
      }

      const [row] = await db
        .update(incomes)
        .set({
          description: input.description,
          amount: input.amount,
          receivedAt: input.receivedAt ?? new Date(),
          receivingAccountId: input.receivingAccountId ?? null,
          categoryId: input.categoryId ?? null,
        })
        .where(and(eq(incomes.id, input.id), eq(incomes.userId, ctx.userId)))
        .returning();

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Income not found.' });
      }

      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      await db.delete(incomes).where(and(eq(incomes.id, input.id), eq(incomes.userId, ctx.userId)));
      return { success: true };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      await db
        .delete(incomes)
        .where(and(inArray(incomes.id, input.ids), eq(incomes.userId, ctx.userId)));
      return { success: true };
    }),
});
