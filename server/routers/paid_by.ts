import { paidBy } from "@/db/schema";
import { db } from "../db";
import { publicProcedure, router } from "../trpc";
import z from "zod";
import { eq } from "drizzle-orm";

export const paidByRouter = router({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(paidBy);
  }),

  getById: publicProcedure.input(z.object({
    id: z.string().min(1, "ID is required"),
  })).query(async ({ input }) => {
    const result = await db.select().from(paidBy).where(eq(paidBy.id, input.id));
    return result[0];
  }),

  create: publicProcedure.input(z.object({
    name: z.string().min(1, "Name is required"),
  })).mutation(async ({ input }) => {
    const result = await db.insert(paidBy).values({
      name: input.name,
    }).returning();

    return result[0];
  }),
});