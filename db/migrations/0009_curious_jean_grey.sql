CREATE TYPE "public"."category_flow" AS ENUM('expense', 'income');--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" bigint NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"receiving_account_id" uuid,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "categories_user_id_idx";--> statement-breakpoint
DROP INDEX "categories_user_name_uidx";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "flow" "category_flow" DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_receiving_account_id_transaction_accounts_id_fk" FOREIGN KEY ("receiving_account_id") REFERENCES "public"."transaction_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incomes_user_received_at_idx" ON "incomes" USING btree ("user_id","received_at");--> statement-breakpoint
CREATE INDEX "incomes_receiving_account_id_idx" ON "incomes" USING btree ("receiving_account_id");--> statement-breakpoint
CREATE INDEX "incomes_category_id_idx" ON "incomes" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_flow_idx" ON "categories" USING btree ("user_id","flow");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_flow_parent_name_uidx" ON "categories" USING btree ("user_id","flow","parent_id","name") WHERE "categories"."parent_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_flow_root_name_uidx" ON "categories" USING btree ("user_id","flow","name") WHERE "categories"."parent_id" IS NULL;