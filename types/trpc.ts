import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../server/routers/_app';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;

// Exemplos:
export type ExpenseFromTRPC = RouterOutputs['expenses']['getAll'][number];
export type CreateExpenseInput = RouterInputs['expenses']['create'];

export type IncomeFromTRPC = RouterOutputs['incomes']['getAll'][number];
export type CreateIncomeInput = RouterInputs['incomes']['create'];

export type AccountWithBalance = RouterOutputs['accounts']['getAllWithBalance'][number];
export type CategoryFromTRPC = RouterOutputs['categories']['getAll'][number];

export type AccountFromTRPC = RouterOutputs['accounts']['getAll'][number];
