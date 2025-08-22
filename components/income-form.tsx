'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { formatCentsBRL, parseCurrencyToCents } from '@/helps/formatCurrency';
import { cn } from '@/lib/utils';
import type { Category, Income } from '@/types/trpc';
import CategoryCombobox from './CategoryCombobox';
import { FieldReceivingAccount } from './field-receiving-account';
import { FieldTransactionAccount } from './field-transaction-account';

const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(1, 'Amount is required'),
  categoryId: z.string().uuid().nullable().optional(),
  receivingAccountId: z.string().uuid().nullable().optional(),
  receivedAt: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

type ProcessedIncomeData = {
  description: string;
  amount: number;
  categoryId?: string | null;
  receivingAccountId?: string | null;
  receivedAt?: Date;
};

interface IncomeFormProps {
  income?: Income;
  onSubmit: (data: ProcessedIncomeData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IncomeForm({
  income,
  onSubmit,
  onCancel,
  isLoading = false,
}: IncomeFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    income?.receivedAt ? new Date(income.receivedAt) : new Date()
  );

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: income?.description ?? '',
      amount: income?.amount ?? 0,
      categoryId: income?.categoryId ?? null,
      receivingAccountId: income?.receivingAccountId ?? null,
      receivedAt: income?.receivedAt ? income.receivedAt.toISOString() : undefined,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (date) {
      form.setValue('receivedAt', date.toISOString());
    }
  }, [date, form]);

  const handleFormSubmit = async (data: IncomeFormData) => {
    const cleanedData: ProcessedIncomeData = {
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId || undefined,
      receivingAccountId: data.receivingAccountId || undefined,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input placeholder="Enter income description" {...field} disabled={isLoading} />
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
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CategoryCombobox
                  flow="income"
                  label="Category"
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FieldReceivingAccount name="receivingAccountId" />

        <FormField
          control={form.control}
          name="receivedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Received Date</FormLabel>
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
            {income ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
