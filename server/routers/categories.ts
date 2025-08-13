import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const categoriesRouter = router({
  getAll: publicProcedure.query(async () => {
    // Implementar busca de categorias
    return await db.select().from(categories);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db.select().from(categories).where(eq(categories.id, input.id));
      return result[0];
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Implementar lógica de criação
      const result = await db.insert(categories).values({
        name: input.name,
        color: input.color,
      }).returning();
      
      return result[0];
    }),
});
