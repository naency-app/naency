import { router } from '../trpc';
import { accountsRouter } from './accounts';
import { balancesRouter } from './balances';
import { categoriesRouter } from './categories';
import { expensesRouter } from './expense';
import { incomesRouter } from './incomes';
import { paidByRouter } from './paid_by';
import { transactionAccountRouter } from './transaction_account';
import { transfersRouter } from './transfers';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
  paidBy: paidByRouter,
  transactionAccount: transactionAccountRouter,
  incomes: incomesRouter,
  accounts: accountsRouter,
  transfers: transfersRouter,
  balances: balancesRouter,
});

export type AppRouter = typeof appRouter;
