import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { accounts } from '@/db/schema';
import { db } from '../db';
import { protectedProcedure, router } from '../trpc';

export const balancesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Consultar saldos usando SQL direto para a view account_balances
    const result = await db.execute(
      `SELECT 
        ab.account_id,
        ab.balance,
        a.name as account_name,
        a.type as account_type,
        a.currency
      FROM account_balances ab
      JOIN accounts a ON a.id = ab.account_id
      WHERE a.user_id = '${userId}' AND a.is_archived = false
      ORDER BY a.name`
    );

    return result.rows;
  }),

  getByAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verificar se a conta pertence ao usuário
      const account = await db.select().from(accounts).where(eq(accounts.id, input.accountId));

      if (account.length === 0 || account[0].userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Consultar saldo específico da conta
      const result = await db.execute(
        `SELECT 
          ab.account_id,
          ab.balance,
          a.name as account_name,
          a.type as account_type,
          a.currency
        FROM account_balances ab
        JOIN accounts a ON a.id = ab.account_id
        WHERE a.id = '${input.accountId}' AND a.user_id = '${userId}'`
      );

      return result.rows[0];
    }),

  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Consultar saldo total de todas as contas
    const result = await db.execute(
      `SELECT 
        SUM(ab.balance) as total_balance,
        a.currency
      FROM account_balances ab
      JOIN accounts a ON a.id = ab.account_id
      WHERE a.user_id = '${userId}' AND a.is_archived = false
      GROUP BY a.currency
      ORDER BY a.currency`
    );

    return result.rows;
  }),
});
