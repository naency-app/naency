import { router } from '../trpc';
import { categoriesRouter } from './categories';
import { userRouter } from './user';


export const appRouter = router({
  user: userRouter,
  categories: categoriesRouter,
});

export type AppRouter = typeof appRouter;
