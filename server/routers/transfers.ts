import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { accountMovements, accounts, transfers } from '@/db/schema';
import { db } from '../db';
import { protectedProcedure, router } from '../trpc';

export const transfersRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return await db
      .select()
      .from(transfers)
      .where(eq(transfers.userId, ctx.userId))
      .orderBy(transfers.occurredAt);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const result = await db
      .select()
      .from(transfers)
      .where(and(eq(transfers.id, input.id), eq(transfers.userId, ctx.userId)));
    return result[0];
  }),

  create: protectedProcedure
    .input(
      z.object({
        fromAccountId: z.string(),
        toAccountId: z.string(),
        amount: z.number().positive(),
        occurredAt: z.date(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verificar se as contas existem e pertencem ao usuário
      const [fromAccount, toAccount] = await Promise.all([
        db
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.userId, ctx.userId))),
        db
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, ctx.userId))),
      ]);

      if (fromAccount.length === 0 || toAccount.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conta de origem ou destino não encontrada',
        });
      }

      if (fromAccount[0].isArchived || toAccount[0].isArchived) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível fazer transferência para/de contas arquivadas',
        });
      }

      // Criar a transferência
      const transferResult = await db
        .insert(transfers)
        .values({
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount: input.amount * 100, // Converter para centavos
          occurredAt: input.occurredAt,
          description: input.description,
          userId: ctx.userId,
        })
        .returning();

      const transfer = transferResult[0];

      // Criar os movimentos nas contas
      await Promise.all([
        // Movimento de saída (negativo) na conta de origem
        db
          .insert(accountMovements)
          .values({
            userId: ctx.userId,
            accountId: input.fromAccountId,
            amount: -(input.amount * 100), // Negativo para saída
            occurredAt: input.occurredAt,
            sourceType: 'transfer',
            sourceId: transfer.id,
          }),
        // Movimento de entrada (positivo) na conta de destino
        db
          .insert(accountMovements)
          .values({
            userId: ctx.userId,
            accountId: input.toAccountId,
            amount: input.amount * 100, // Positivo para entrada
            occurredAt: input.occurredAt,
            sourceType: 'transfer',
            sourceId: transfer.id,
          }),
      ]);

      return transfer;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fromAccountId: z.string().optional(),
        toAccountId: z.string().optional(),
        amount: z.number().positive().optional(),
        occurredAt: z.date().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Buscar a transferência atual
      const currentTransfer = await db
        .select()
        .from(transfers)
        .where(and(eq(transfers.id, input.id), eq(transfers.userId, ctx.userId)));

      if (currentTransfer.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const transfer = currentTransfer[0];

      // Se mudou valor ou contas, precisamos atualizar os movimentos
      if (
        input.amount !== undefined ||
        input.fromAccountId !== undefined ||
        input.toAccountId !== undefined
      ) {
        // Remover movimentos antigos
        await db
          .delete(accountMovements)
          .where(
            and(
              eq(accountMovements.sourceType, 'transfer'),
              eq(accountMovements.sourceId, input.id)
            )
          );

        // Criar novos movimentos
        const newAmount = input.amount ?? transfer.amount / 100;
        const newFromAccountId = input.fromAccountId ?? transfer.fromAccountId;
        const newToAccountId = input.toAccountId ?? transfer.toAccountId;
        const newOccurredAt = input.occurredAt ?? transfer.occurredAt;

        await Promise.all([
          db.insert(accountMovements).values({
            userId: ctx.userId,
            accountId: newFromAccountId,
            amount: -(newAmount * 100),
            occurredAt: newOccurredAt,
            sourceType: 'transfer',
            sourceId: input.id,
          }),
          db.insert(accountMovements).values({
            userId: ctx.userId,
            accountId: newToAccountId,
            amount: newAmount * 100,
            occurredAt: newOccurredAt,
            sourceType: 'transfer',
            sourceId: input.id,
          }),
        ]);
      }

      // Atualizar a transferência
      const result = await db
        .update(transfers)
        .set({
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount: input.amount ? input.amount * 100 : undefined,
          occurredAt: input.occurredAt,
          description: input.description,
        })
        .where(and(eq(transfers.id, input.id), eq(transfers.userId, ctx.userId)))
        .returning();

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Remover movimentos primeiro
      await db
        .delete(accountMovements)
        .where(
          and(eq(accountMovements.sourceType, 'transfer'), eq(accountMovements.sourceId, input.id))
        );

      // Remover a transferência
      const result = await db
        .delete(transfers)
        .where(and(eq(transfers.id, input.id), eq(transfers.userId, ctx.userId)))
        .returning();

      return result[0];
    }),
});
