'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCalendar, IconChevronDown, IconCreditCard } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CategoryCombobox from '@/components/CategoryCombobox';
import { AccountForm } from '@/components/feature/account/account-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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

// --- Schema fora do componente (já estava) ---
const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(1, 'Amount is required'), // centavos
  categoryId: z.string().uuid().nullable().optional(),
  accountId: z.string().uuid({ message: 'Select an account' }),
  receivedAt: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

type ProcessedIncomeData = {
  description: string;
  amount: number; // centavos
  categoryId?: string | null;
  accountId: string;
  receivedAt?: Date;
};

interface IncomeFormProps {
  income?: IncomeFromTRPC;
  accounts: AccountFromTRPC[];
  onSubmit: (data: ProcessedIncomeData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: 'bottom' | 'right';
}

export function IncomeForm({
  income,
  accounts,
  onSubmit,
  onCancel,
  isLoading = false,
  open,
  onOpenChange,
  direction = 'right',
}: IncomeFormProps) {
  // --- Memo: defaultValues não muda a cada render ---
  const defaultValues = useMemo<IncomeFormData>(
    () => ({
      description: income?.description ?? '',
      amount: income?.amount ?? 0,
      categoryId: income?.categoryId ?? null,
      accountId: income?.accountId ?? '',
      receivedAt: income?.receivedAt ? new Date(income.receivedAt).toISOString() : undefined,
    }),
    [income]
  );

  // --- RHF: menos validação em tempo real = menos custo ---
  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
    mode: 'onBlur', // <— trocado de 'onChange' para 'onBlur'
    reValidateMode: 'onBlur',
    // criteriaMode: 'firstError', // opcional: evita agrupar todos os erros
    // delayError: 150,           // opcional se preferir 'onChange' com atraso
  });

  const [date, setDate] = useState<Date | undefined>(
    income?.receivedAt ? new Date(income.receivedAt) : new Date()
  );
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);



  useEffect(() => {
    if (date)
      form.setValue('receivedAt', date.toISOString(), { shouldDirty: true, shouldValidate: false });
  }, [date, form]);

  // --- Função de reset estável e reutilizável ---
  const resetFromIncome = useCallback(() => {
    form.reset(defaultValues, { keepDefaultValues: true });
    setDate(income?.receivedAt ? new Date(income.receivedAt) : new Date());
  }, [form, defaultValues, income]);

  // Reset quando muda o income (edição vs criação)
  useEffect(() => {
    resetFromIncome();
  }, [resetFromIncome]);

  // Reset ao fechar (se controlado externamente)
  useEffect(() => {
    if (typeof open !== 'undefined' && open === false) {
      resetFromIncome();
    }
  }, [open, resetFromIncome]);

  const handleCancel = useCallback(() => {
    resetFromIncome();
    onCancel();
  }, [onCancel, resetFromIncome]);

  const handleFormSubmit = useCallback(
    async (data: IncomeFormData) => {
      const cleanedData: ProcessedIncomeData = {
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        accountId: data.accountId,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
      };
      await onSubmit(cleanedData);
    },
    [onSubmit]
  );

  // --- Memo: options de contas ---
  const accountOptions = useMemo(
    () =>
      accounts.map((acc) => (
        <SelectItem key={acc.id} value={acc.id}>
          {acc.name}
        </SelectItem>
      )),
    [accounts]
  );

  const noAccountsView = (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <IconCreditCard className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium">No accounts yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first account to record incomes.
        </p>
      </div>
      <div className="flex gap-2 w-full">
        <Button className="flex-1" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={() => setIsAccountDrawerOpen(true)}>
          Create account
        </Button>
      </div>
    </div>
  );

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Date */}
        <FormField
          control={form.control}
          name="receivedAt"
          render={() => (
            <FormItem>
              <FormLabel>Received Date</FormLabel>
              <FormControl>
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
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

                  {/* Calendar só monta quando abre */}
                  {isDatePopoverOpen && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          if (selectedDate) {
                            setDate(selectedDate);
                            setIsDatePopoverOpen(false);
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount (com digitação fluida) */}
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


        {/* Description */}
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

        {/* Account */}
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
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
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
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
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
        </DrawerFooter>
      </form>
    </Form>
  );

  const body = accounts.length === 0 ? noAccountsView : content;

  // Drawer controlado
  if (typeof open !== 'undefined' && onOpenChange) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction={direction} dismissible={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{income ? 'Edit income' : 'Create new income'}</DrawerTitle>
            <DrawerDescription>
              {income
                ? 'Update the information for the selected income.'
                : 'Fill in the information to create a new income.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">{body}</div>

          {/* Monta AccountForm só quando necessário */}
          {isAccountDrawerOpen && (
            <AccountForm
              open={isAccountDrawerOpen}
              onOpenChange={setIsAccountDrawerOpen}
              direction={direction}
              onSuccess={(newAccountId) => {
                if (newAccountId) {
                  form.setValue('accountId', newAccountId, { shouldValidate: true });
                }
                setIsAccountDrawerOpen(false);
              }}
            />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Versão não-drawer
  return (
    <>
      {body}
      {isAccountDrawerOpen && (
        <AccountForm
          open={isAccountDrawerOpen}
          onOpenChange={setIsAccountDrawerOpen}
          direction={direction}
          onSuccess={(newAccountId) => {
            if (newAccountId) {
              form.setValue('accountId', newAccountId, { shouldValidate: true });
            }
            setIsAccountDrawerOpen(false);
          }}
        />
      )}
    </>
  );
}
