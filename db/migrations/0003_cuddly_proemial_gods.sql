CREATE TABLE "paid_by" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "paid_by_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "paid_by_name_uidx" ON "paid_by" USING btree ("name");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_id_paid_by_id_fk" FOREIGN KEY ("paid_by_id") REFERENCES "public"."paid_by"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_paid_by_id_idx" ON "expenses" USING btree ("paid_by_id");