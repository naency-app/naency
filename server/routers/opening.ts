// server/routers/openings.ts
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { accountMovements, accountOpenings, accounts } from '@/db/schema';
import { db } from '../db';
import { protectedProcedure, router } from '../trpc';

async function assertAccountOwnedByUser(accountId: string, userId: string) {
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Conta inexistente ou não pertence ao usuário.',
    });
  }
}

async function getOpeningByAccount(accountId: string) {
  const [o] = await db
    .select()
    .from(accountOpenings)
    .where(eq(accountOpenings.accountId, accountId))
    .limit(1);
  return o ?? null;
}

async function hasMovementsOtherThanOpening(accountId: string) {
  const res = await db.execute(sql`
    SELECT 1
    FROM account_movements m
    WHERE m.account_id = ${accountId}
      AND NOT (m.source_type = 'opening_balance')
    LIMIT 1;
  `);
  return (res.rowCount ?? 0) > 0;
}

export const openingsRouter = router({
  ensureOpening: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        amountCents: z.number(),
        occurredAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
        note: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await assertAccountOwnedByUser(input.accountId, userId);

      const existing = await getOpeningByAccount(input.accountId);
      if (existing) return existing;

      const [opening] = await db.transaction(async (tx) => {
        const [o] = await tx
          .insert(accountOpenings)
          .values({
            userId: userId,
            accountId: input.accountId,
            amount: input.amountCents,
            occurredAt: input.occurredAt,
            note: input.note ?? 'Saldo inicial',
          })
          .returning();

        await tx.insert(accountMovements).values({
          userId: userId,
          accountId: input.accountId,
          amount: o.amount,
          occurredAt: o.occurredAt,
          sourceType: 'opening_balance',
          sourceId: o.id,
          note: o.note,
        });

        return [o];
      });

      return opening;
    }),

  getByAccount: protectedProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await assertAccountOwnedByUser(input.accountId, userId);

      return await getOpeningByAccount(input.accountId);
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const rows = await db.execute(sql`
      SELECT
        o.id,
        o.user_id AS "userId",
        o.account_id AS "accountId",
        a.name AS "accountName",
        a.type AS "accountType",
        a.currency AS "accountCurrency",
        o.amount,
        o.occurred_at AS "occurredAt",
        o.note,
        o.created_at AS "createdAt"
      FROM account_openings o
      JOIN accounts a ON a.id = o.account_id
      WHERE o.user_id = ${ctx.userId}
      ORDER BY o.created_at DESC;
    `);

    return rows.rows as Array<{
      id: string;
      userId: string;
      accountId: string;
      accountName: string;
      accountType: 'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other';
      accountCurrency: string | null;
      amount: number;
      occurredAt: string;
      note: string | null;
      createdAt: string;
    }>;
  }),

  updateOpening: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        amountCents: z.number().optional(),
        occurredAt: z.preprocess(
          (v) => (v ? (typeof v === 'string' ? new Date(v) : v) : undefined),
          z.date().optional()
        ),
        note: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await assertAccountOwnedByUser(input.accountId, ctx.userId);

      const opening = await getOpeningByAccount(input.accountId);
      if (!opening) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Abertura não encontrada para esta conta.',
        });
      }

      if (await hasMovementsOtherThanOpening(input.accountId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível atualizar a abertura: já existem outros movimentos nessa conta.',
        });
      }

      const [updated] = await db.transaction(async (tx) => {
        const newAmount = input.amountCents ?? opening.amount;
        const newDate = input.occurredAt ?? opening.occurredAt;
        const newNote = input.note ?? opening.note;

        const [o] = await tx
          .update(accountOpenings)
          .set({
            amount: newAmount,
            occurredAt: newDate,
            note: newNote,
          })
          .where(eq(accountOpenings.id, opening.id))
          .returning();

        await tx
          .update(accountMovements)
          .set({
            amount: newAmount,
            occurredAt: newDate,
            note: newNote,
          })
          .where(
            and(
              eq(accountMovements.accountId, input.accountId),
              eq(accountMovements.sourceType, 'opening_balance' as any),
              eq(accountMovements.sourceId, opening.id)
            )
          );

        return [o];
      });

      return updated;
    }),

  deleteOpening: protectedProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await assertAccountOwnedByUser(input.accountId, ctx.userId);

      const opening = await getOpeningByAccount(input.accountId);
      if (!opening) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Abertura não encontrada para esta conta.',
        });
      }

      if (await hasMovementsOtherThanOpening(input.accountId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível remover a abertura: já existem outros movimentos nessa conta.',
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(accountMovements)
          .where(
            and(
              eq(accountMovements.accountId, input.accountId),
              eq(accountMovements.sourceType, 'opening_balance' as any),
              eq(accountMovements.sourceId, opening.id)
            )
          );

        await tx.delete(accountOpenings).where(eq(accountOpenings.id, opening.id));
      });

      return { deleted: true };
    }),

  applyAdjustment: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        diffCents: z
          .number()
          .int()
          .refine((v) => v !== 0, 'diffCents não pode ser zero'),
        occurredAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
        note: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await assertAccountOwnedByUser(input.accountId, ctx.userId);

      const id = crypto.randomUUID();

      await db.insert(accountMovements).values({
        id,
        userId: ctx.userId,
        accountId: input.accountId,
        amount: input.diffCents,
        occurredAt: input.occurredAt,
        sourceType: 'adjustment' as any,
        sourceId: id,
        note: input.note ?? 'Adjustment (reconciliation)',
      });

      return { applied: true, id };
    }),
});
