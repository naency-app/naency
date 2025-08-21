import { router } from '../trpc';
import { categoriesRouter } from './categories';
import { expensesRouter } from './expense';
import { paidByRouter } from './paid_by';
import { transactionAccountRouter } from './transaction_account';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
  paidBy: paidByRouter,
  transactionAccount: transactionAccountRouter,
});

export type AppRouter = typeof appRouter;
