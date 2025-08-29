import { TRPCError } from '@trpc/server';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { accountMovements, accounts, categories, incomes } from '@/db/schema';
import { protectedProcedure, router } from '../trpc';

const baseIncome = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().int().min(1, 'Amount is required'), // centavos
  categoryId: z.string().uuid().optional().nullable(),
  receivedAt: z.coerce.date().optional().nullable(),
  accountId: z.string().uuid(), // <-- unificado no schema atual
});

const dateRangeFilter = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function assertValidAccount(userId: string, accountId: string) {
  const [acc] = await db
    .select({ id: accounts.id, isArchived: accounts.isArchived })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  if (!acc) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid accountId' });
  if (acc.isArchived) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Account is archived' });
}

async function assertValidIncomeCategory(userId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const [cat] = await db
    .select({ id: categories.id, flow: categories.flow, isArchived: categories.isArchived })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!cat) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid categoryId' });
  if (cat.isArchived) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Category is archived' });
  if (cat.flow !== 'income') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Category flow must be "income"' });
  }
}

export const incomesRouter = router({
  getAll: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const conds: any[] = [eq(incomes.userId, ctx.userId)];
    if (input?.from) conds.push(gte(incomes.receivedAt, input.from));
    if (input?.to) {
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1);
      conds.push(lte(incomes.receivedAt, endDate));
    }

    return await db
      .select()
      .from(incomes)
      .where(and(...conds))
      .orderBy(incomes.receivedAt);
  }),

  getTotal: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const conds: any[] = [eq(incomes.userId, ctx.userId)];
    if (input?.from) conds.push(gte(incomes.receivedAt, input.from));
    if (input?.to) {
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1);
      conds.push(lte(incomes.receivedAt, endDate));
    }

    const res = await db
      .select({ total: sql<number>`COALESCE(SUM(${incomes.amount}), 0)` })
      .from(incomes)
      .where(and(...conds));
    return res[0]?.total ?? 0;
  }),

  create: protectedProcedure.input(baseIncome).mutation(async ({ input, ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    await assertValidAccount(ctx.userId, input.accountId);
    await assertValidIncomeCategory(ctx.userId, input.categoryId ?? null);

    // 1) cria a receita
    const [row] = await db
      .insert(incomes)
      .values({
        userId: ctx.userId,
        description: input.description,
        amount: input.amount,
        receivedAt: input.receivedAt ?? new Date(),
        accountId: input.accountId,
        categoryId: input.categoryId ?? null,
      })
      .returning();

    // 2) cria movimento (se falhar, remove a receita)
    try {
      await db.insert(accountMovements).values({
        userId: ctx.userId,
        accountId: input.accountId,
        amount: input.amount,
        occurredAt: row.receivedAt ?? row.createdAt,
        sourceType: 'income',
        sourceId: row.id,
      });
    } catch (err) {
      await db.delete(incomes).where(and(eq(incomes.id, row.id), eq(incomes.userId, ctx.userId)));
      throw err;
    }

    return row;
  }),

  update: protectedProcedure
    .input(baseIncome.extend({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      await assertValidAccount(ctx.userId, input.accountId);
      await assertValidIncomeCategory(ctx.userId, input.categoryId ?? null);

      // pega estado antigo para possível rollback
      const [prev] = await db
        .select({
          id: incomes.id,
          description: incomes.description,
          amount: incomes.amount,
          receivedAt: incomes.receivedAt,
          accountId: incomes.accountId,
          categoryId: incomes.categoryId,
          createdAt: incomes.createdAt,
        })
        .from(incomes)
        .where(and(eq(incomes.id, input.id), eq(incomes.userId, ctx.userId)))
        .limit(1);

      if (!prev) throw new TRPCError({ code: 'NOT_FOUND', message: 'Income not found.' });

      // 1) atualiza receita
      const [row] = await db
        .update(incomes)
        .set({
          description: input.description,
          amount: input.amount,
          receivedAt: input.receivedAt ?? new Date(),
          accountId: input.accountId,
          categoryId: input.categoryId ?? null,
        })
        .where(and(eq(incomes.id, input.id), eq(incomes.userId, ctx.userId)))
        .returning();

      try {
        // 2) remove movimentos antigos do source
        await db
          .delete(accountMovements)
          .where(
            and(
              eq(accountMovements.userId, ctx.userId),
              eq(accountMovements.sourceType, 'income'),
              eq(accountMovements.sourceId, input.id)
            )
          );

        // 3) cria movimento novo
        await db.insert(accountMovements).values({
          userId: ctx.userId,
          accountId: input.accountId,
          amount: input.amount,
          occurredAt: row.receivedAt ?? row.createdAt,
          sourceType: 'income',
          sourceId: input.id,
        });

        return row;
      } catch (err) {
        // rollback best-effort
        await db
          .update(incomes)
          .set({
            description: prev.description,
            amount: prev.amount,
            receivedAt: prev.receivedAt,
            accountId: prev.accountId,
            categoryId: prev.categoryId,
          })
          .where(and(eq(incomes.id, prev.id), eq(incomes.userId, ctx.userId)));

        try {
          await db.insert(accountMovements).values({
            userId: ctx.userId,
            accountId: prev.accountId,
            amount: prev.amount,
            occurredAt: prev.receivedAt ?? prev.createdAt,
            sourceType: 'income',
            sourceId: prev.id,
          });
        } catch {}
        throw err;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      await db
        .delete(accountMovements)
        .where(
          and(
            eq(accountMovements.userId, ctx.userId),
            eq(accountMovements.sourceType, 'income'),
            eq(accountMovements.sourceId, input.id)
          )
        );

      await db.delete(incomes).where(and(eq(incomes.id, input.id), eq(incomes.userId, ctx.userId)));
      return { success: true };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      await db
        .delete(accountMovements)
        .where(
          and(
            eq(accountMovements.userId, ctx.userId),
            eq(accountMovements.sourceType, 'income'),
            inArray(accountMovements.sourceId, input.ids)
          )
        );

      await db
        .delete(incomes)
        .where(and(inArray(incomes.id, input.ids), eq(incomes.userId, ctx.userId)));

      return { success: true };
    }),
});
