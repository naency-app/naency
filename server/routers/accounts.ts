import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { accountMovements, accounts } from '@/db/schema';
import { db } from '../db';
import { protectedProcedure, router } from '../trpc';

export const accountsRouter = router({
  /** Contas ativas (sem saldo) */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.userId), eq(accounts.isArchived, false)));
  }),

  /** Contas incluindo arquivadas (sem saldo) */
  getAllIncludingArchived: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return await db.select().from(accounts).where(eq(accounts.userId, ctx.userId));
  }),

  /** Conta por id (sem saldo) */
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const result = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.userId)));

    return result[0] ?? null;
  }),

  /** Contas (ativas por padrão) + saldo agregado por movimentos */
  getAllWithBalance: protectedProcedure
    .input(z.object({ includeArchived: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Usa agregação direta sobre account_movements (sem depender da view)
      const rows = await db.execute(sql`
        SELECT
          a.id,
          a.user_id AS "userId",
          a.name,
          a.type,
          a.currency,
          a.is_archived AS "isArchived",
          a.archived_at AS "archivedAt",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          COALESCE(SUM(m.amount), 0)::bigint AS balance
        FROM accounts a
        LEFT JOIN account_movements m
          ON m.account_id = a.id
        WHERE a.user_id = ${ctx.userId}
        ${input?.includeArchived ? sql`` : sql`AND a.is_archived = false`}
        GROUP BY a.id
        ORDER BY a.created_at DESC;
      `);

      return rows.rows as Array<{
        id: string;
        userId: string;
        name: string;
        type: 'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other';
        currency: string | null;
        isArchived: boolean;
        archivedAt: string | null;
        createdAt: string;
        updatedAt: string;
        balance: number; // centavos
      }>;
    }),

  /** Conta por id + saldo */
  getByIdWithBalance: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const rows = await db.execute(sql`
        SELECT
          a.id,
          a.user_id AS "userId",
          a.name,
          a.type,
          a.currency,
          a.is_archived AS "isArchived",
          a.archived_at AS "archivedAt",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          COALESCE(SUM(m.amount), 0)::bigint AS balance
        FROM accounts a
        LEFT JOIN account_movements m
          ON m.account_id = a.id
        WHERE a.user_id = ${ctx.userId}
          AND a.id = ${input.id}
        GROUP BY a.id
        LIMIT 1;
      `);

      return rows.rows?.[0] ?? null;
    }),

  /** Criar conta (ativa) */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(['bank', 'cash', 'credit_card', 'ewallet', 'other']).default('bank'),
        currency: z.string().length(3).default('BRL'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const [row] = await db
          .insert(accounts)
          .values({
            userId: ctx.userId,
            name: input.name,
            type: input.type,
            currency: input.currency,
            isArchived: false,
            archivedAt: null,
          })
          .returning();

        return row;
      } catch (e: any) {
        // lida com unique index (accounts_user_name_active_uidx)
        if (e?.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Já existe uma conta ativa com esse nome.',
          });
        }
        throw e;
      }
    }),

  /** Atualizar conta */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        type: z.enum(['bank', 'cash', 'credit_card', 'ewallet', 'other']).optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const [row] = await db
          .update(accounts)
          .set({
            name: input.name,
            type: input.type,
            currency: input.currency,
            updatedAt: new Date(),
          })
          .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.userId)))
          .returning();

        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Conta não encontrada' });
        return row;
      } catch (e: any) {
        // lida com unique index (accounts_user_name_active_uidx)
        if (e?.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Já existe uma conta ativa com esse nome.',
          });
        }
        throw e;
      }
    }),

  /** Arquivar conta (permitido mesmo com movimentos) */
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const [row] = await db
        .update(accounts)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.userId)))
        .returning();

      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Conta não encontrada' });
      return row;
    }),

  /** Reativar conta */
  unarchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const [row] = await db
          .update(accounts)
          .set({
            isArchived: false,
            archivedAt: null,
            updatedAt: new Date(),
          })
          .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.userId)))
          .returning();

        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Conta não encontrada' });
        return row;
      } catch (e: any) {
        // possível conflito de nome ativo ao reativar
        if (e?.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Já existe uma conta ativa com esse nome.',
          });
        }
        throw e;
      }
    }),

  /** Excluir conta (bloqueia se houver movimentos) */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Verifica se há movimentos na conta
      const movements = await db
        .select({ id: accountMovements.id })
        .from(accountMovements)
        .where(eq(accountMovements.accountId, input.id))
        .limit(1);

      if (movements.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível excluir uma conta que possui movimentos',
        });
      }

      const [row] = await db
        .delete(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.userId)))
        .returning();

      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Conta não encontrada' });
      return row;
    }),
});
