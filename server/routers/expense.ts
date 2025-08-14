import { db } from "@/db/drizzle";
import { publicProcedure, router } from "../trpc";
import { expenses } from "@/db/schema";
import z from "zod";

export const expensesRouter = router({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(expenses);
  }),


  create: publicProcedure.input(z.object({
    name: z.string(),
    amount: z.string(),
    categoryId: z.string(),
    paidAt: z.date(),
  })).mutation(async ({ input }) => {
    return await db.insert(expenses).values({
      name: input.name,
      amount: input.amount,
      categoryId: input.categoryId,
      paidAt: input.paidAt,
    });
  }),
});