'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CategoryCombobox from '@/components/CategoryCombobox';
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
import type { AccountFromTRPC, IncomeFromTRPC } from '@/types/trpc';

const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(1, 'Amount is required'), // centavos
  categoryId: z.string().uuid().nullable().optional(),
  accountId: z.string().uuid({ message: 'Select an account' }), // <-- unificado (obrigatório)
  receivedAt: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

type ProcessedIncomeData = {
  description: string;
  amount: number; // centavos
  categoryId?: string | null;
  accountId: string; // <-- unificado
  receivedAt?: Date;
};

interface IncomeFormProps {
  income?: IncomeFromTRPC;
  accounts: AccountFromTRPC[];
  onSubmit: (data: ProcessedIncomeData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IncomeForm({
  income,
  accounts,
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
      accountId: income?.accountId ?? undefined, // requerido
      receivedAt: income?.receivedAt ? new Date(income.receivedAt).toISOString() : undefined,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (date) form.setValue('receivedAt', date.toISOString());
  }, [date, form]);

  const handleFormSubmit = async (data: IncomeFormData) => {
    const cleanedData: ProcessedIncomeData = {
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId || undefined,
      accountId: data.accountId,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
    };
    await onSubmit(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="receivedAt"
          render={() => (
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

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="flex-[2]">
              <FormLabel>Amount *</FormLabel>
              <FormControl>
                <Input
                  value={formatCentsBRL(Number(field.value ?? 0))}
                  onChange={(e) => field.onChange(parseCurrencyToCents(e.target.value))}
                  inputMode="numeric"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {/* Account (unificado) */}
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

        {/* Category (mantida) */}
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
