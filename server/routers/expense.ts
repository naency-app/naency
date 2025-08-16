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
    name: z.string().min(1, "Nome é obrigatório"),
    amount: z.string().min(1, "Valor é obrigatório"),
    categoryId: z.string().optional().nullable(),
    paidAt: z.date().optional().nullable(),
  })).mutation(async ({ input }) => {
    console.log("Creating expense with input:", input);
    
    const result = await db.insert(expenses).values({
      name: input.name,
      amount: input.amount,
      categoryId: input.categoryId || null,
      paidAt: input.paidAt || null,
    }).returning();
    
    return result[0];
  }),

  update: publicProcedure.input(z.object({
    id: z.string().min(1, "ID é obrigatório"),
    name: z.string().min(1, "Nome é obrigatório"),
    amount: z.string().min(1, "Valor é obrigatório"),
    categoryId: z.string().optional().nullable(),
    paidAt: z.date().optional().nullable(),
  })).mutation(async ({ input }) => {
    console.log("=== UPDATE EXPENSE DEBUG ===");
    console.log("Raw input:", input);
    console.log("Input type:", typeof input);
    console.log("Input keys:", Object.keys(input));
    console.log("Input ID:", input.id);
    console.log("Input name:", input.name);
    console.log("Input amount:", input.amount);
    console.log("Input categoryId:", input.categoryId);
    console.log("Input paidAt:", input.paidAt);
    console.log("==========================");
    
    try {
      const result = await db.update(expenses)
        .set({
          name: input.name,
          amount: input.amount,
          categoryId: input.categoryId || null,
          paidAt: input.paidAt || null,
        })
        .where(eq(expenses.id, input.id))
        .returning();
      
      console.log("Update result:", result);
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