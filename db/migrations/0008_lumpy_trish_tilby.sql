ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");