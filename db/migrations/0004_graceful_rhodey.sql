DROP INDEX "categories_name_uidx";--> statement-breakpoint
DROP INDEX "paid_by_name_uidx";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "paid_by" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_by" ADD CONSTRAINT "paid_by_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_uidx" ON "categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "expenses_user_id_idx" ON "expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "paid_by_user_id_idx" ON "paid_by" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paid_by_user_name_uidx" ON "paid_by" USING btree ("user_id","name");