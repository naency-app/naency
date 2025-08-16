import { router } from '../trpc';
import { categoriesRouter } from './categories';
import { userRouter } from './user';
import { expensesRouter } from './expense';
import { paidByRouter } from './paid_by';

export const appRouter = router({
  user: userRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
  paidBy: paidByRouter,
});

export type AppRouter = typeof appRouter;
