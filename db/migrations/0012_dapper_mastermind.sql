CREATE TYPE "public"."payment_method" AS ENUM('unspecified', 'cash', 'pix', 'boleto', 'debit_card', 'credit_card', 'bank_transfer', 'ted', 'doc', 'ewallet', 'paypal', 'other');--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "payment_method" "payment_method" DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "payment_ref" varchar(120);--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "payment_method" "payment_method" DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "payment_ref" varchar(120);--> statement-breakpoint
CREATE INDEX "expenses_payment_method_idx" ON "expenses" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "incomes_payment_method_idx" ON "incomes" USING btree ("payment_method");
--> statement-breakpoint
-- Backfill básico: inferir payment_method a partir do tipo da conta
UPDATE "expenses" e
SET "payment_method" = 'cash'
FROM "accounts" a
WHERE e."account_id" = a."id" AND a."type" = 'cash';
--> statement-breakpoint
UPDATE "expenses" e
SET "payment_method" = 'credit_card'
FROM "accounts" a
WHERE e."account_id" = a."id" AND a."type" = 'credit_card';
--> statement-breakpoint
UPDATE "incomes" i
SET "payment_method" = 'cash'
FROM "accounts" a
WHERE i."account_id" = a."id" AND a."type" = 'cash';
--> statement-breakpoint
UPDATE "incomes" i
SET "payment_method" = 'credit_card'
FROM "accounts" a
WHERE i."account_id" = a."id" AND a."type" = 'credit_card';