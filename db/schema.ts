import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const categoryFlowEnum = pgEnum('category_flow', ['expense', 'income']);
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    userIdIdx: index('session_user_id_idx').on(t.userId),
    expiresIdx: index('session_expires_at_idx').on(t.expiresAt),
  })
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerPairUniq: uniqueIndex('account_provider_pair_uidx').on(t.providerId, t.accountId),
    userIdIdx: index('account_user_id_idx').on(t.userId),
  })
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    identifierIdx: index('verification_identifier_idx').on(t.identifier),
    expiresIdx: index('verification_expires_at_idx').on(t.expiresAt),
  })
);

export const jwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    flow: categoryFlowEnum('flow').notNull().default('expense'),
    name: varchar('name', { length: 120 }).notNull(),
    color: varchar('color', { length: 24 }),
    parentId: uuid('parent_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFlowIdx: index('categories_user_flow_idx').on(t.userId, t.flow),
    parentIdIdx: index('categories_parent_id_idx').on(t.parentId),

    siblingsUniq: uniqueIndex('categories_user_flow_parent_name_uidx')
      .on(t.userId, t.flow, t.parentId, t.name)
      .where(sql`${t.parentId} IS NOT NULL`),

    rootUniq: uniqueIndex('categories_user_flow_root_name_uidx')
      .on(t.userId, t.flow, t.name)
      .where(sql`${t.parentId} IS NULL`),

    parentFk: foreignKey({
      name: 'categories_parent_id_fkey',
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete('set null'),
  })
);
export const paidBy = pgTable(
  'paid_by',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('paid_by_user_id_idx').on(t.userId),
    userNameUniq: uniqueIndex('paid_by_user_name_uidx').on(t.userId, t.name),
  })
);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date' }),
    paidById: uuid('paid_by_id').references(() => paidBy.id, { onDelete: 'set null' }),
    transactionAccountId: uuid('transaction_account_id').references(() => transactionAccounts.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('expenses_user_id_idx').on(t.userId),
    categoryIdx: index('expenses_category_id_idx').on(t.categoryId),
    paidByIdIdx: index('expenses_paid_by_id_idx').on(t.paidById),
    transactionAccountIdx: index('expenses_transaction_account_id_idx').on(t.transactionAccountId),
    nonNegativeAmount: check('expenses_amount_non_negative', sql`${t.amount} >= 0`),
  })
);

export const transactionAccounts = pgTable('transaction_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const incomes = pgTable(
  'incomes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    description: varchar('description', { length: 255 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' }).notNull(),

    receivingAccountId: uuid('receiving_account_id').references(() => transactionAccounts.id, {
      onDelete: 'set null',
    }),

    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userDateIdx: index('incomes_user_received_at_idx').on(t.userId, t.receivedAt),
    accountIdx: index('incomes_receiving_account_id_idx').on(t.receivingAccountId),
    categoryIdx: index('incomes_category_id_idx').on(t.categoryId),
    nonNegativeAmount: sql`CHECK (${t.amount} >= 0)`,
  })
);

import { sql } from 'drizzle-orm';
