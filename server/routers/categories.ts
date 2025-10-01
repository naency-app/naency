import { TRPCError } from '@trpc/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { categories } from '@/db/schema';
import { db } from '../db';
import { publicProcedure, router } from '../trpc';

/** Helpers */
async function getCategoryOwned(userId: string, id: string) {
  const [cat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);
  return cat ?? null;
}

async function ensureNoCycle(userId: string, id: string, newParentId?: string | null) {
  if (!newParentId) return;
  if (newParentId === id) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Uma categoria não pode ser pai de si mesma',
    });
  }
  // newParentId não pode ser descendente de id
  const descendants = await db.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id, parent_id FROM categories WHERE id = ${id} AND user_id = ${userId}
      UNION ALL
      SELECT c.id, c.parent_id
      FROM categories c
      JOIN tree t ON c.parent_id = t.id
      WHERE c.user_id = ${userId}
    )
    SELECT id FROM tree;
  `);
  const ids: string[] = descendants.rows?.map((r: Record<string, unknown>) => r.id as string) ?? [];
  if (ids.includes(newParentId)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Referência circular detectada' });
  }
}

export const categoriesRouter = router({
  /** Lista simples (ativas por padrão) */
  getAll: publicProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().optional(),
          flow: z.enum(['expense', 'income']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const where = [
        eq(categories.userId, ctx.userId),
        ...(input?.flow ? [eq(categories.flow, input.flow)] : []),
        ...(input?.includeArchived ? [] : [eq(categories.isArchived, false)]),
      ];

      return await db
        .select()
        .from(categories)
        .where(and(...where));
    }),

  /** Pais (sem parentId) – ativas por padrão */
  getParentCategories: publicProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().optional(),
          flow: z.enum(['expense', 'income']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const where = [
        eq(categories.userId, ctx.userId),
        isNull(categories.parentId),
        ...(input?.flow ? [eq(categories.flow, input.flow)] : []),
        ...(input?.includeArchived ? [] : [eq(categories.isArchived, false)]),
      ];

      return await db
        .select()
        .from(categories)
        .where(and(...where));
    }),

  /** Filhas de um pai – ativas por padrão */
  getSubcategories: publicProcedure
    .input(z.object({ parentId: z.string(), includeArchived: z.boolean().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const where = [
        eq(categories.userId, ctx.userId),
        eq(categories.parentId, input.parentId),
        ...(input?.includeArchived ? [] : [eq(categories.isArchived, false)]),
      ];

      return await db
        .select()
        .from(categories)
        .where(and(...where));
    }),

  /** Hierarquia (pais + filhas) – ativas por padrão; aceita filtro por flow e includeArchived */
  getHierarchical: publicProcedure
    .input(
      z
        .object({
          flow: z.enum(['expense', 'income']).optional(),
          includeArchived: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const where = [
        eq(categories.userId, ctx.userId),
        ...(input?.flow ? [eq(categories.flow, input.flow)] : []),
        ...(input?.includeArchived ? [] : [eq(categories.isArchived, false)]),
      ];

      const all = await db
        .select()
        .from(categories)
        .where(and(...where));
      const parents = all.filter((c) => !c.parentId);
      const children = all.filter((c) => c.parentId);

      return parents.map((p) => ({
        ...p,
        subcategories: children.filter((s) => s.parentId === p.id),
      }));
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    if (!input.id || input.id.trim() === '') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'ID da categoria é obrigatório' });
    }

    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.userId)));
    return result[0] ?? null;
  }),

  /** Criar – valida pai (existe, do usuário, não arquivado) e fluxo consistente */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
        parentId: z.string().optional(),
        flow: z.enum(['expense', 'income']).optional().default('expense'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      let finalFlow = input.flow;
      if (input.parentId && input.parentId.trim() !== '') {
        const parent = await getCategoryOwned(ctx.userId, input.parentId);
        if (!parent)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria pai não encontrada' });
        if (parent.isArchived)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria pai está arquivada' });
        // o fluxo da filha segue o do pai
        finalFlow = parent.flow;
      }

      const [row] = await db
        .insert(categories)
        .values({
          userId: ctx.userId,
          name: input.name,
          color: input.color,
          parentId: input.parentId && input.parentId.trim() !== '' ? input.parentId : null,
          flow: finalFlow,
          isArchived: false,
          archivedAt: null,
        })
        .returning();

      return row;
    }),

  /** Atualizar – valida pai, fluxo e previne ciclos */
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        parentId: z.string().nullable().optional(), // permitir remover pai
        flow: z.enum(['expense', 'income']).optional(), // só vale se virar pai (root)
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (!input.id || input.id.trim() === '') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'ID da categoria é obrigatório' });
      }

      const current = await getCategoryOwned(ctx.userId, input.id);
      if (!current) throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });

      // Se setar novo pai, valida existência, arquivamento e evita ciclo
      if (typeof input.parentId !== 'undefined' && input.parentId && input.parentId.trim() !== '') {
        const parent = await getCategoryOwned(ctx.userId, input.parentId);
        if (!parent)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria pai não encontrada' });
        if (parent.isArchived)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria pai está arquivada' });
        await ensureNoCycle(ctx.userId, input.id, input.parentId);
        // filha deve herdar fluxo do pai
        if (current.flow !== parent.flow || (input.flow && input.flow !== parent.flow)) {
          input.flow = parent.flow;
        }
      }

      // Se virar root (parentId null), pode alterar flow (se enviado)
      if (typeof input.parentId !== 'undefined' && !input.parentId) {
        // ok – root; se input.flow vier, respeita
      } else {
        // se continuar com pai, flow já foi ajustado acima
        if (typeof input.flow !== 'undefined' && input.parentId) {
          // já sanado acima, só garantindo consistência
          const parent = await getCategoryOwned(ctx.userId, input.parentId);
          if (parent && input.flow && input.flow !== parent.flow) {
            input.flow = parent.flow;
          }
        }
      }

      const [row] = await db
        .update(categories)
        .set({
          name: input.name ?? current.name,
          color: input.color ?? current.color,
          parentId:
            typeof input.parentId === 'undefined'
              ? current.parentId
              : input.parentId && input.parentId.trim() !== ''
                ? input.parentId
                : null,
          flow: typeof input.flow === 'undefined' ? current.flow : input.flow,
        })
        .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.userId)))
        .returning();

      return row;
    }),

  /** Arquivar – se cascade=false, bloqueia se houver descendentes ativos; se true, arquiva descendentes via CTE */
  archive: publicProcedure
    .input(z.object({ id: z.string(), cascade: z.boolean().optional().default(false) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (!input.id || input.id.trim() === '') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'ID da categoria é obrigatório' });
      }

      const cat = await getCategoryOwned(ctx.userId, input.id);
      if (!cat) throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });
      if (cat.isArchived) return { success: true }; // já arquivada

      if (!input.cascade) {
        const q = await db.execute(sql`
          WITH RECURSIVE tree AS (
            SELECT id, parent_id, is_archived
            FROM categories
            WHERE id = ${input.id} AND user_id = ${ctx.userId}
            UNION ALL
            SELECT c.id, c.parent_id, c.is_archived
            FROM categories c
            JOIN tree t ON c.parent_id = t.id
            WHERE c.user_id = ${ctx.userId}
          )
          SELECT COUNT(*)::int AS cnt FROM tree WHERE id <> ${input.id} AND is_archived = false;
        `);

        const cnt = Number(q.rows?.[0]?.cnt ?? 0);
        if (cnt > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Existe(m) subcategoria(s) ativa(s). Use cascade=true para arquivar tudo.',
          });
        }
        await db
          .update(categories)
          .set({ isArchived: true, archivedAt: sql`now()` })
          .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.userId)));
        return { success: true };
      }

      // cascade = true: arquiva toda a subárvore
      await db.execute(sql`
        WITH RECURSIVE tree AS (
          SELECT id, parent_id FROM categories WHERE id = ${input.id} AND user_id = ${ctx.userId}
          UNION ALL
          SELECT c.id, c.parent_id
          FROM categories c
          JOIN tree t ON c.parent_id = t.id
          WHERE c.user_id = ${ctx.userId}
        )
        UPDATE categories
        SET is_archived = true, archived_at = now()
        WHERE user_id = ${ctx.userId} AND id IN (SELECT id FROM tree);
      `);

      return { success: true };
    }),

  /** Reativar – só permite se o pai (se existir) estiver ativo */
  unarchive: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (!input.id || input.id.trim() === '') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'ID da categoria é obrigatório' });
      }

      const cat = await getCategoryOwned(ctx.userId, input.id);
      if (!cat) throw new TRPCError({ code: 'NOT_FOUND', message: 'Categoria não encontrada' });

      if (cat.parentId) {
        const parent = await getCategoryOwned(ctx.userId, cat.parentId);
        if (!parent)
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria pai não encontrada' });
        if (parent.isArchived) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível reativar: o pai está arquivado',
          });
        }
      }

      await db
        .update(categories)
        .set({ isArchived: false, archivedAt: null })
        .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.userId)));

      return { success: true };
    }),
});
