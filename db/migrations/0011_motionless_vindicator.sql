ALTER TYPE "public"."movement_source_type" ADD VALUE 'opening_balance';--> statement-breakpoint
ALTER TYPE "public"."movement_source_type" ADD VALUE 'adjustment';--> statement-breakpoint
CREATE TABLE "account_openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"note" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_movements" ADD COLUMN "note" varchar(255);--> statement-breakpoint
ALTER TABLE "account_openings" ADD CONSTRAINT "account_openings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_openings" ADD CONSTRAINT "account_openings_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_openings_account_uidx" ON "account_openings" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_openings_user_idx" ON "account_openings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_openings_account_idx" ON "account_openings" USING btree ("account_id");--> statement-breakpoint
CREATE VIEW "public"."account_balances" AS (select "accounts"."id", coalesce(sum("account_movements"."amount"), 0) as "balance" from "accounts" left join "account_movements" on "account_movements"."account_id" = "accounts"."id" group by "accounts"."id");