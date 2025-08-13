"use server";

import { db } from "@/db/drizzle";
import { categories } from "@/db/schema";
import { z } from "zod";
import { getServerSession } from "@/lib/get-server-session";

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export async function createCategory(data: unknown) {
  const session = await getServerSession();
  if (!session?.session) throw new Error("Unauthorized");

  const parsed = categorySchema.parse(data);

  await db.insert(categories).values({
    name: parsed.name,
    color: parsed.color || null,
  });
}

export async function listCategories() {
  const session = await getServerSession();
  if (!session?.session) throw new Error("Unauthorized");

  return db.select().from(categories);
}
