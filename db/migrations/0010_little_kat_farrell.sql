CREATE TYPE "public"."account_type" AS ENUM('bank', 'cash', 'credit_card', 'ewallet', 'other');--> statement-breakpoint
CREATE TYPE "public"."movement_source_type" AS ENUM('expense', 'income', 'transfer');--> statement-breakpoint
CREATE TABLE "account_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"source_type" "movement_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_movements_amount_nonzero" CHECK ("account_movements"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "account_type" DEFAULT 'bank' NOT NULL,
	"name" varchar(255) NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL',
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"from_account_id" uuid NOT NULL,
	"to_account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"description" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_amount_positive" CHECK ("transfers"."amount" > 0),
	CONSTRAINT "transfers_from_to_diff" CHECK ("transfers"."from_account_id" <> "transfers"."to_account_id")
);
--> statement-breakpoint
ALTER TABLE "paid_by" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transaction_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "paid_by" CASCADE;--> statement-breakpoint
DROP TABLE "transaction_accounts" CASCADE;--> statement-breakpoint
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_paid_by_id_paid_by_id_fk";
--> statement-breakpoint
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_transaction_account_id_transaction_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_receiving_account_id_transaction_accounts_id_fk";
--> statement-breakpoint
DROP INDEX "categories_user_flow_parent_name_uidx";--> statement-breakpoint
DROP INDEX "categories_user_flow_root_name_uidx";--> statement-breakpoint
DROP INDEX "expenses_paid_by_id_idx";--> statement-breakpoint
DROP INDEX "expenses_transaction_account_id_idx";--> statement-breakpoint
DROP INDEX "incomes_receiving_account_id_idx";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_movements_source_uidx" ON "account_movements" USING btree ("source_type","source_id","account_id");--> statement-breakpoint
CREATE INDEX "account_movements_user_idx" ON "account_movements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_movements_account_idx" ON "account_movements" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_name_active_uidx" ON "accounts" USING btree ("user_id","name") WHERE "accounts"."is_archived" = false;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_type_idx" ON "accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transfers_user_idx" ON "transfers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transfers_from_idx" ON "transfers" USING btree ("from_account_id");--> statement-breakpoint
CREATE INDEX "transfers_to_idx" ON "transfers" USING btree ("to_account_id");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_flow_parent_name_active_uidx" ON "categories" USING btree ("user_id","flow","parent_id","name") WHERE "categories"."parent_id" IS NOT NULL AND "categories"."is_archived" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_flow_root_name_active_uidx" ON "categories" USING btree ("user_id","flow","name") WHERE "categories"."parent_id" IS NULL AND "categories"."is_archived" = false;--> statement-breakpoint
CREATE INDEX "expenses_account_id_idx" ON "expenses" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "incomes_account_id_idx" ON "incomes" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "paid_by_id";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "transaction_account_id";--> statement-breakpoint
ALTER TABLE "incomes" DROP COLUMN "receiving_account_id";--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_amount_non_negative" CHECK ("incomes"."amount" >= 0);