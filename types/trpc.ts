import { type AppRouter } from '../server/routers/_app';

export type { AppRouter } from '../server/routers/_app';

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Category = {
  id: string;
  name: string;
  color?: string;
  createdAt?: Date;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  categoryId?: string;
  paidById?: string;
  paidAt?: Date;
  createdAt?: Date;
};