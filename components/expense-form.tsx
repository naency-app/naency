"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconCalendar, IconChevronDown } from "@tabler/icons-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type Category, type Expense } from "@/types/trpc";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldCategory } from "./field-category";
import { FieldPaidBy } from "./field-paid-by";
import { formatCentsBRL, parseCurrencyToCents } from "@/helps/formatCurrency";

const expenseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(1, "Amount is required"), // Agora aceita valores como 589734 (centavos)
  categoryId: z.string().uuid().nullable().optional(),
  paidById: z.string().uuid().nullable().optional(),
  paidAt: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

type ProcessedExpenseData = {
  name: string;
  amount: number;
  categoryId?: string | null;
  paidById?: string | null;
  paidAt?: Date;
};

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  paidBy?: Array<{ id: string; name: string; createdAt?: Date }>;
  onSubmit: (data: ProcessedExpenseData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({
  expense,
  categories,
  onSubmit,
  onCancel,
  isLoading = false
}: ExpenseFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    expense?.paidAt ? new Date(expense.paidAt) : new Date()
  );

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: expense?.name ?? "",
      amount: expense?.amount ?? 0,
      categoryId: expense?.categoryId ?? null,
      paidById: expense?.paidById ?? null,
      paidAt: expense?.paidAt ? expense.paidAt.toISOString() : undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (date) {
      form.setValue("paidAt", date.toISOString());
    }
  }, [date, form]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    const cleanedData: ProcessedExpenseData = {
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId || undefined,
      paidById: data.paidById || undefined,
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
    };

    try {
      await onSubmit(cleanedData);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };
  console.log(form.formState.errors);
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter expense description"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="flex-[2]">
              <FormLabel>Amount *</FormLabel>
              <FormControl>
                <Input

                  value={formatCentsBRL(Number(field.value ?? 0))}
                  onChange={(e) => {
                    const cents = parseCurrencyToCents(e.target.value);
                    field.onChange(cents);
                  }}
                  inputMode="numeric"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FieldCategory<ExpenseFormData> name="categoryId" />

        <FieldPaidBy<ExpenseFormData> name="paidById" />


        <FormField
          control={form.control}
          name="paidAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment date</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : "Select a date"}
                      <IconChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || isLoading}
            className="flex-1"
            isLoading={isLoading}
          >
            {expense ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
