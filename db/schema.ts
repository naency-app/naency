// db/schema.ts

import { sql } from 'drizzle-orm';
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

/* ========================
   Auth / Infra (sem mudanças de regra)
   ======================== */

export const categoryFlowEnum = pgEnum('category_flow', ['expense', 'income']);
export const accountTypeEnum = pgEnum('account_type', [
  'bank',
  'cash',
  'credit_card',
  'ewallet',
  'other',
]);
export const movementSourceTypeEnum = pgEnum('movement_source_type', [
  'expense',
  'income',
  'transfer',
]);

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

/* ========================
   Categorias (com arquivamento lógico)
   ======================== */

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
    isArchived: boolean('is_archived').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFlowIdx: index('categories_user_flow_idx').on(t.userId, t.flow),
    parentIdIdx: index('categories_parent_id_idx').on(t.parentId),

    // Uniques apenas para categorias ativas
    siblingsUniqActive: uniqueIndex('categories_user_flow_parent_name_active_uidx')
      .on(t.userId, t.flow, t.parentId, t.name)
      .where(sql`${t.parentId} IS NOT NULL AND ${t.isArchived} = false`),

    rootUniqActive: uniqueIndex('categories_user_flow_root_name_active_uidx')
      .on(t.userId, t.flow, t.name)
      .where(sql`${t.parentId} IS NULL AND ${t.isArchived} = false`),

    parentFk: foreignKey({
      name: 'categories_parent_id_fkey',
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete('set null'),
  })
);

/* ========================
   Contas unificadas + movimentos + transferências
   ======================== */

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: accountTypeEnum('type').notNull().default('bank'),
    name: varchar('name', { length: 255 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('BRL'),
    isArchived: boolean('is_archived').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userNameActiveUniq: uniqueIndex('accounts_user_name_active_uidx')
      .on(t.userId, t.name)
      .where(sql`${t.isArchived} = false`),
    userIdx: index('accounts_user_id_idx').on(t.userId),
    typeIdx: index('accounts_type_idx').on(t.type),
  })
);

export const accountMovements = pgTable(
  'account_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    // Convenção: crédito > 0; débito < 0 (em centavos)
    amount: bigint('amount', { mode: 'number' }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    sourceType: movementSourceTypeEnum('source_type').notNull(),
    sourceId: uuid('source_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    srcUniq: uniqueIndex('account_movements_source_uidx').on(t.sourceType, t.sourceId, t.accountId),
    userIdx: index('account_movements_user_idx').on(t.userId),
    accountIdx: index('account_movements_account_idx').on(t.accountId),
    nonZeroCheck: check('account_movements_amount_nonzero', sql`${t.amount} <> 0`),
  })
);

export const transfers = pgTable(
  'transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fromAccountId: uuid('from_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    toAccountId: uuid('to_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    amount: bigint('amount', { mode: 'number' }).notNull(), // sempre positivo
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('transfers_user_idx').on(t.userId),
    fromIdx: index('transfers_from_idx').on(t.fromAccountId),
    toIdx: index('transfers_to_idx').on(t.toAccountId),
    positiveAmount: check('transfers_amount_positive', sql`${t.amount} > 0`),
    preventSameAccount: check(
      'transfers_from_to_diff',
      sql`${t.fromAccountId} <> ${t.toAccountId}`
    ),
  })
);

/* ========================
   Despesas e Receitas (com accountId unificado)
   ======================== */

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
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('expenses_user_id_idx').on(t.userId),
    categoryIdx: index('expenses_category_id_idx').on(t.categoryId),
    accountIdx: index('expenses_account_id_idx').on(t.accountId),
    nonNegativeAmount: check('expenses_amount_non_negative', sql`${t.amount} >= 0`),
  })
);

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
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userDateIdx: index('incomes_user_received_at_idx').on(t.userId, t.receivedAt),
    accountIdx: index('incomes_account_id_idx').on(t.accountId),
    categoryIdx: index('incomes_category_id_idx').on(t.categoryId),
    nonNegativeAmount: check('incomes_amount_non_negative', sql`${t.amount} >= 0`),
  })
);

// Observação: a view account_balances é criada via migração SQL (abaixo).
