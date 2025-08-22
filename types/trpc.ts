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
  color?: string | null;
  flow: 'expense' | 'income';
  createdAt?: string | Date;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  categoryId?: string;
  paidById?: string;
  transactionAccountId?: string;
  paidAt?: Date;
  createdAt?: Date;
};

export type Income = {
  id: string;
  description: string;
  amount: number;
  categoryId?: string;
  receivingAccountId?: string;
  receivedAt: Date;
  createdAt?: Date;
};
