import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

export type Context = {
  // Simplified context for testing
};

export async function createTRPCContext(opts: { headers: Headers }): Promise<Context> {
  // Simplified context for testing
  return {};
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
  // Simplified for testing
  return next();
});
