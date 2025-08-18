import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { paidBy } from '@/db/schema';
import { db } from '../db';
import { publicProcedure, router } from '../trpc';

export const paidByRouter = router({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(paidBy);
  }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, 'ID is required'),
      })
    )
    .query(async ({ input }) => {
      const result = await db.select().from(paidBy).where(eq(paidBy.id, input.id));
      return result[0];
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const result = await db
        .insert(paidBy)
        .values({
          name: input.name,
          userId: ctx.userId!,
        })
        .returning();

      return result[0];
    }),
});
