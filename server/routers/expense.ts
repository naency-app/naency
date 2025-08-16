import { db } from "@/db/drizzle";
import { publicProcedure, router } from "../trpc";
import { expenses } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

export const expensesRouter = router({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(expenses);
  }),

  create: publicProcedure.input(z.object({
    name: z.string().min(1, "Name is required"),
    amount: z.number().min(1, "Amount is required"),
    categoryId: z.string().optional().nullable(),
    paidAt: z.date().optional().nullable(),
    paidById: z.string().optional().nullable(),
  })).mutation(async ({ input }) => {
    console.log("Creating expense with input:", input);
    
    const result = await db.insert(expenses).values({
      name: input.name,
      amount: input.amount,
      categoryId: input.categoryId || null,
      paidAt: input.paidAt || null,
      paidById: input.paidById || null,
    }).returning();
    
    return result[0];
  }),

  update: publicProcedure.input(z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required"),
    amount: z.number().min(1, "Amount is required"),
    categoryId: z.string().optional().nullable(),
    paidAt: z.date().optional().nullable(),
    paidById: z.string().optional().nullable(),
  })).mutation(async ({ input }) => {
    
    
    try {
      const result = await db.update(expenses)
        .set({
          name: input.name,
          amount: input.amount,
          categoryId: input.categoryId || null,
          paidAt: input.paidAt || null,
          paidById: input.paidById || null,
        })
        .where(eq(expenses.id, input.id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }),

  delete: publicProcedure.input(z.object({
    id: z.string().uuid(),
  })).mutation(async ({ input }) => {
    await db.delete(expenses).where(eq(expenses.id, input.id));
    return { success: true };
  }),

  deleteMany: publicProcedure.input(z.object({
    ids: z.array(z.string().uuid()),
  })).mutation(async ({ input }) => {
    await db.delete(expenses).where(inArray(expenses.id, input.ids));
    return { success: true };
  }),
});