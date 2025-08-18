// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { auth } from '@/lib/auth'; // ⬅️ seu instance do Better Auth

export type Context = {
  userId: string | null;
  session: { user: { id: string } } | null;
  headers: Headers;
};

export async function createTRPCContext({ headers }: { headers: Headers }): Promise<Context> {
  // Better Auth lê o cookie dos headers e retorna a sessão
  const session = await auth.api.getSession({ headers }); // ✅
  const userId = session?.user?.id ?? null;

  return { userId, session: session ? { user: { id: userId! } } : null, headers };
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
