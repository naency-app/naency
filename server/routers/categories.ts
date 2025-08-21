import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
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

  // 👈 Nova função para buscar categorias pai (sem parentId)
  getParentCategories: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, ctx.userId), isNull(categories.parentId)));
  }),

  // 👈 Nova função para buscar subcategorias de uma categoria específica
  getSubcategories: publicProcedure
    .input(z.object({ parentId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      return await db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, ctx.userId), eq(categories.parentId, input.parentId)));
    }),

  // 👈 Nova função para buscar categorias com suas subcategorias (estrutura hierárquica)
  getHierarchical: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, ctx.userId));

    // Organizar em estrutura hierárquica
    const parentCategories = allCategories.filter((cat) => !cat.parentId);
    const subcategories = allCategories.filter((cat) => cat.parentId);

    return parentCategories.map((parent) => ({
      ...parent,
      subcategories: subcategories.filter((sub) => sub.parentId === parent.id),
    }));
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
        parentId: z.string().optional(), // 👈 Novo campo opcional
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // 👈 Validação: se parentId for fornecido, verificar se a categoria pai existe
      if (input.parentId) {
        const parentCategory = await db
          .select()
          .from(categories)
          .where(and(eq(categories.id, input.parentId), eq(categories.userId, ctx.userId)));

        if (parentCategory.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Categoria pai não encontrada',
          });
        }
      }

      const result = await db
        .insert(categories)
        .values({
          name: input.name,
          color: input.color,
          parentId: input.parentId, // 👈 Incluir parentId se fornecido
          userId: ctx.userId,
        })
        .returning();

      return result[0];
    }),

  // 👈 Nova função para atualizar categoria (incluindo mudança de hierarquia)
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // 👈 Validação: se parentId for fornecido, verificar se a categoria pai existe
      if (input.parentId) {
        const parentCategory = await db
          .select()
          .from(categories)
          .where(and(eq(categories.id, input.parentId), eq(categories.userId, ctx.userId)));

        if (parentCategory.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Categoria pai não encontrada',
          });
        }

        // 👈 Prevenir referência circular (categoria não pode ser pai de si mesma)
        if (input.parentId === input.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Uma categoria não pode ser pai de si mesma',
          });
        }
      }

      const result = await db
        .update(categories)
        .set({
          name: input.name,
          color: input.color,
          parentId: input.parentId,
        })
        .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.userId)))
        .returning();

      return result[0];
    }),
});
