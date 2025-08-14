import { router } from '../trpc';
import { categoriesRouter } from './categories';
import { userRouter } from './user';
import { expensesRouter } from './expense';

export const appRouter = router({
  user: userRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
});

export type AppRouter = typeof appRouter;
