import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { getServerSession } from '@/lib/get-server-session';

export type SessionRow = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionResult = { session: SessionRow } | null;

export type Context = {
  session: SessionResult;
  userId: string | null;
};

export async function createTRPCContext(opts: { headers: Headers }): Promise<Context> {
  const session = await getServerSession(opts.headers);
  const userId = session?.session.userId ?? null;
  return { session, userId };
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

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});
