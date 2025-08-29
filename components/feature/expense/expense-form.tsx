'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CategoryCombobox from '@/components/CategoryCombobox';
// REMOVIDOS:
// import { FieldPaidBy } from '@/components/field-paid-by';
// import { FieldTransactionAccount } from '@/components/field-transaction-account';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCentsBRL, parseCurrencyToCents } from '@/helps/formatCurrency';
import { cn } from '@/lib/utils';
import type { AccountFromTRPC, CategoryFromTRPC, ExpenseFromTRPC } from '@/types/trpc';

const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().min(1, 'Amount is required'), // em centavos
  categoryId: z.string().uuid().nullable().optional(),
  accountId: z.string().uuid({ message: 'Select an account' }), // <-- NOVO (obrigatório)
  paidAt: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

type ProcessedExpenseData = {
  name: string;
  amount: number; // centavos
  categoryId?: string | null;
  accountId: string; // <-- NOVO
  paidAt?: Date;
  parentCategoryId?: string | null;
};

interface ExpenseFormProps {
  expense?: ExpenseFromTRPC;

  accounts: AccountFromTRPC[];
  onSubmit: (data: ProcessedExpenseData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({
  expense,

  accounts,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    expense?.paidAt ? new Date(expense.paidAt) : new Date()
  );

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: expense?.name ?? '',
      amount: expense?.amount ?? 0,
      categoryId: expense?.categoryId ?? null,
      accountId: expense?.accountId ?? undefined, // requerido; ficará inválido até escolher
      paidAt: expense?.paidAt ? new Date(expense.paidAt).toISOString() : undefined,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (date) {
      form.setValue('paidAt', date.toISOString());
    }
  }, [date, form]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    const cleanedData: ProcessedExpenseData = {
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId || undefined,
      accountId: data.accountId, // <-- NOVO
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
    };

    try {
      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                      disabled={isLoading}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: ptBR }) : 'Select a date'}
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input placeholder="Enter expense description" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account *</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading || accounts.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={accounts.length ? 'Select an account' : 'No accounts available'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria (mantida) */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <CategoryCombobox
              flow="expense"
              label="Category"
              value={field.value}
              onValueChange={(v) => field.onChange(v)}
            />
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
            {expense ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
