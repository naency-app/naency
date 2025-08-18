import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { categories } from '@/db/schema';
import { db } from '../db';
import { publicProcedure, router } from '../trpc';

export const categoriesRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return await db.select().from(categories).where(eq(categories.userId, ctx.userId));
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.select().from(categories).where(eq(categories.id, input.id));
    return result[0];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const result = await db
        .insert(categories)
        .values({
          name: input.name,
          color: input.color,
          userId: ctx.userId,
        })
        .returning();

      return result[0];
    }),
});
