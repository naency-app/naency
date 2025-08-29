import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { accounts } from '@/db/schema';
import { protectedProcedure, router } from '../trpc';

export const transactionAccountRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return await db.select().from(accounts).where(eq(accounts.userId, ctx.userId));
  }),
});
