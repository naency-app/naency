import { TRPCError } from '@trpc/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import {
  accountMovements,
  accounts,
  categories,
  expenses,
  type paymentMethodEnum,
} from '@/db/schema';
import { protectedProcedure, router } from '../trpc';

const baseExpense = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().int().min(1, 'Amount is required'), // centavos
  categoryId: z.string().uuid().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  accountId: z.string().uuid(), // conta unificada
  paymentMethod: z
    .enum([
      'unspecified',
      'cash',
      'pix',
      'boleto',
      'debit_card',
      'credit_card',
      'bank_transfer',
      'ted',
      'doc',
      'ewallet',
      'paypal',
      'other',
    ])
    .default('unspecified'),
  paymentRef: z.string().max(120).optional(),
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

async function assertValidExpenseCategory(userId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const [cat] = await db
    .select({ id: categories.id, isArchived: categories.isArchived, flow: categories.flow })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!cat) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid categoryId' });
  if (cat.isArchived) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Category is archived' });
  if (cat.flow !== 'expense') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Category flow must be "expense"' });
  }
}

const paidOrCreated = (e = expenses) => sql`COALESCE(${e.paidAt}, ${e.createdAt})`;

export const expensesRouter = router({
  getAll: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const conds = [eq(expenses.userId, ctx.userId)];
    if (input?.from) conds.push(sql`${paidOrCreated()} >= ${input.from}`);
    if (input?.to) {
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1);
      conds.push(sql`${paidOrCreated()} < ${endDate}`);
    }

    return await db
      .select()
      .from(expenses)
      .where(and(...conds))
      .orderBy(paidOrCreated());
  }),

  getTotal: protectedProcedure.input(dateRangeFilter.optional()).query(async ({ ctx, input }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const conds = [eq(expenses.userId, ctx.userId)];
    if (input?.from) conds.push(sql`${paidOrCreated()} >= ${input.from}`);
    if (input?.to) {
      const endDate = new Date(input.to);
      endDate.setDate(endDate.getDate() + 1);
      conds.push(sql`${paidOrCreated()} < ${endDate}`);
    }

    const res = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(...conds));
    return res[0]?.total ?? 0;
  }),

  getExpensesByCategories: protectedProcedure
    .input(dateRangeFilter.optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const conds = [eq(expenses.userId, ctx.userId)];
      if (input?.from) conds.push(sql`${paidOrCreated()} >= ${input.from}`);
      if (input?.to) {
        const endDate = new Date(input.to);
        endDate.setDate(endDate.getDate() + 1);
        conds.push(sql`${paidOrCreated()} < ${endDate}`);
      }

      const expensesWithCategories = await db
        .select({ amount: expenses.amount, categoryId: expenses.categoryId })
        .from(expenses)
        .where(and(...conds));

      const allCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          color: categories.color,
          parentId: categories.parentId,
          flow: categories.flow,
          isArchived: categories.isArchived,
        })
        .from(categories)
        .where(eq(categories.userId, ctx.userId));

      const totals = new Map<string, number>();
      for (const e of expensesWithCategories) {
        if (e.categoryId) totals.set(e.categoryId, (totals.get(e.categoryId) || 0) + e.amount);
      }

      const parents = allCategories.filter((c) => !c.parentId && c.flow === 'expense');
      const children = allCategories.filter((c) => c.parentId && c.flow === 'expense');

      return parents.map((p) => ({
        ...p,
        total: totals.get(p.id) || 0,
        subcategories: children
          .filter((s) => s.parentId === p.id)
          .map((s) => ({ ...s, total: totals.get(s.id) || 0 })),
      }));
    }),

  create: protectedProcedure.input(baseExpense).mutation(async ({ input, ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    await assertValidAccount(ctx.userId, input.accountId);
    await assertValidExpenseCategory(ctx.userId, input.categoryId ?? null);

    // 1) cria a despesa
    const [row] = await db
      .insert(expenses)
      .values({
        userId: ctx.userId,
        name: input.name,
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        paidAt: input.paidAt ?? null,
        accountId: input.accountId,
        paymentMethod: (input.paymentMethod ??
          'unspecified') as (typeof paymentMethodEnum.enumValues)[number],
        paymentRef: input.paymentRef ?? null,
      })
      .returning();

    // 2) cria o movimento (se falhar, remove a despesa)
    try {
      await db.insert(accountMovements).values({
        userId: ctx.userId,
        accountId: input.accountId,
        amount: -input.amount,
        occurredAt: input.paidAt ?? row.createdAt,
        sourceType: 'expense',
        sourceId: row.id,
      });
    } catch (err) {
      await db
        .delete(expenses)
        .where(and(eq(expenses.id, row.id), eq(expenses.userId, ctx.userId)));
      throw err;
    }

    return row;
  }),

  update: protectedProcedure
    .input(baseExpense.extend({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await assertValidAccount(ctx.userId, input.accountId);
      await assertValidExpenseCategory(ctx.userId, input.categoryId ?? null);

      // pega estado antigo para possível rollback
      const [prev] = await db
        .select({
          id: expenses.id,
          name: expenses.name,
          amount: expenses.amount,
          categoryId: expenses.categoryId,
          paidAt: expenses.paidAt,
          accountId: expenses.accountId,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, ctx.userId)))
        .limit(1);

      if (!prev) throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' });

      // 1) atualiza a despesa
      const [row] = await db
        .update(expenses)
        .set({
          name: input.name,
          amount: input.amount,
          categoryId: input.categoryId ?? null,
          paidAt: input.paidAt ?? null,
          accountId: input.accountId,
          paymentMethod: (input.paymentMethod ??
            'unspecified') as (typeof paymentMethodEnum.enumValues)[number],
          paymentRef: input.paymentRef ?? null,
        })
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, ctx.userId)))
        .returning();

      try {
        // 2) remove movimentos antigos desse source
        await db
          .delete(accountMovements)
          .where(
            and(
              eq(accountMovements.userId, ctx.userId),
              eq(accountMovements.sourceType, 'expense'),
              eq(accountMovements.sourceId, input.id)
            )
          );

        // 3) cria o movimento novo
        await db.insert(accountMovements).values({
          userId: ctx.userId,
          accountId: input.accountId,
          amount: -input.amount,
          occurredAt: input.paidAt ?? row.createdAt,
          sourceType: 'expense',
          sourceId: input.id,
        });

        return row;
      } catch (err) {
        // rollback best-effort: restaura a despesa e o movimento antigo
        await db
          .update(expenses)
          .set({
            name: prev.name,
            amount: prev.amount,
            categoryId: prev.categoryId,
            paidAt: prev.paidAt,
            accountId: prev.accountId,
          })
          .where(and(eq(expenses.id, prev.id), eq(expenses.userId, ctx.userId)));

        // recria movimento antigo (ignora erro)
        try {
          await db.insert(accountMovements).values({
            userId: ctx.userId,
            accountId: prev.accountId,
            amount: -prev.amount,
            occurredAt: prev.paidAt ?? prev.createdAt,
            sourceType: 'expense',
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

      // apaga movimentos primeiro; depois a despesa
      await db
        .delete(accountMovements)
        .where(
          and(
            eq(accountMovements.userId, ctx.userId),
            eq(accountMovements.sourceType, 'expense'),
            eq(accountMovements.sourceId, input.id)
          )
        );

      await db
        .delete(expenses)
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, ctx.userId)));
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
            eq(accountMovements.sourceType, 'expense'),
            inArray(accountMovements.sourceId, input.ids)
          )
        );

      await db
        .delete(expenses)
        .where(and(inArray(expenses.id, input.ids), eq(expenses.userId, ctx.userId)));

      return { success: true };
    }),
});
