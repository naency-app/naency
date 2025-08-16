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

const expenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  categoryId: z.string().optional().or(z.literal("")),
  paidAt: z.date().optional().nullable(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  onSubmit: (data: {
    name: string;
    amount: string;
    categoryId?: string;
    paidAt?: Date;
  }) => Promise<void>;
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
    expense?.paidAt ? new Date(expense.paidAt) : undefined
  );

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: expense?.name || "",
      amount: expense?.amount || "",
      categoryId: expense?.categoryId || "",
      paidAt: expense?.paidAt || undefined,
    },
  });

  useEffect(() => {
    if (date) {
      form.setValue("paidAt", date);
    }
  }, [date, form]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    console.log("Form data being submitted:", data);
    console.log("Form validation state:", form.formState);
    
    // Limpar e validar os dados antes de enviar
    const cleanedData = {
      ...data,
      categoryId: data.categoryId && data.categoryId !== "" ? data.categoryId : undefined,
      paidAt: data.paidAt || undefined,
    };
    
    console.log("Cleaned data:", cleanedData);
    
    try {
      await onSubmit(cleanedData);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo exceto números e vírgula
    const numericValue = value.replace(/[^\d,]/g, "");
    
    // Converte vírgula para ponto para parse
    const normalizedValue = numericValue.replace(",", ".");
    
    // Se não tem ponto decimal, adiciona .00
    if (!normalizedValue.includes(".")) {
      return `${normalizedValue}.00`;
    }
    
    return normalizedValue;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatCurrency(value);
    form.setValue("amount", formattedValue);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite a descrição da despesa"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-row gap-4 w-full">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-[2]">
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={field.value}
                    onChange={handleAmountChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value || undefined)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paidAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de pagamento</FormLabel>
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
                      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
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
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || isLoading}
            className="flex-1"
          >
            {isLoading ? "Salvando..." : expense ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
