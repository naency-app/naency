import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { user } from '@/db/schema';
import { db } from '../db';
import { publicProcedure, router } from '../trpc';

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(user);
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.select().from(user).where(eq(user.id, input.id));
    return result[0];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Implementar lógica de criação
      return { success: true, data: input };
    }),
});
