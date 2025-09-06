'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
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
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

type DrawerDirection = 'bottom' | 'right' | 'left' | 'top';

interface AccountFormProps {
  onSuccess?: (accountId?: string) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: DrawerDirection;
}

export function AccountForm({
  onSuccess,
  onCancel,
  open,
  onOpenChange,
  direction = 'right',
}: AccountFormProps) {
  const utils = trpc.useUtils();
  const accountSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['bank', 'cash', 'credit_card', 'ewallet', 'other']),
    currency: z.string().regex(/^[A-Za-z]{3}$/i, 'Use a 3-letter currency'),
    openingAmountCents: z.number().int().optional(),
    openingDate: z.string().optional(),
    openingNote: z.string().max(255).optional(),
  });

  type AccountFormData = z.infer<typeof accountSchema>;

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'bank',
      currency: 'BRL',
      openingAmountCents: 0,
      openingDate: new Date().toISOString(),
      openingNote: '',
    },
    mode: 'onChange',
  });

  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [openingDate, setOpeningDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (openingDate) {
      form.setValue('openingDate', openingDate.toISOString());
    }
  }, [openingDate, form]);

  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: (acc) => {
      toast.success('Account created!');
      utils.accounts.getAll.invalidate();
      utils.accounts.getAllWithBalance.invalidate();
      form.reset({
        name: '',
        type: 'bank',
        currency: 'BRL',
        openingAmountCents: 0,
        openingDate: new Date().toISOString(),
        openingNote: '',
      });
      setOpeningDate(new Date());
      setIsDatePopoverOpen(false);
      onSuccess?.(acc?.id);
      onOpenChange?.(false);
    },
    onError: (err) => toast.error(err.message || 'Error creating account'),
  });

  const handleFormSubmit = (data: AccountFormData) => {
    const cleaned = {
      name: data.name.trim(),
      type: data.type,
      currency: data.currency.toUpperCase() as 'BRL' | string,
      openingAmountCents:
        typeof data.openingAmountCents === 'number' && data.openingAmountCents !== 0
          ? data.openingAmountCents
          : undefined,
      openingDate: data.openingDate ? new Date(data.openingDate) : undefined,
      openingNote: data.openingNote?.trim() || undefined,
    };

    createAccount.mutate(cleaned);
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="openingDate"
          render={() => (
            <FormItem>
              <FormLabel>Opening date</FormLabel>
              <FormControl>
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !openingDate && 'text-muted-foreground'
                      )}
                      disabled={createAccount.isPending}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {openingDate ? format(openingDate, 'PPP', { locale: ptBR }) : 'Select a date'}
                      <IconChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={openingDate}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setOpeningDate(selectedDate);
                          setIsDatePopoverOpen(false);
                        }
                      }}
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
          name="openingAmountCents"
          render={({ field }) => (
            <FormItem className="flex-[2]">
              <FormLabel>Opening amount</FormLabel>
              <FormControl>
                <Input
                  value={formatCentsBRL(Number(field.value ?? 0))}
                  onChange={(e) => {
                    const cents = parseCurrencyToCents(e.target.value);
                    field.onChange(cents);
                  }}
                  inputMode="numeric"
                  disabled={createAccount.isPending}
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
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Nubank, Carteira, Cartão XP"
                  {...field}
                  disabled={createAccount.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency *</FormLabel>
              <FormControl>
                <Input
                  value={field.value}
                  onChange={(e) => {
                    const v = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, '')
                      .slice(0, 3);
                    field.onChange(v);
                  }}
                  placeholder="Ex.: BRL, USD"
                  disabled={createAccount.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openingNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Input
                  placeholder="Saldo inicial, transferência, etc."
                  {...field}
                  disabled={createAccount.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={createAccount.isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit card</SelectItem>
                  <SelectItem value="ewallet">E-wallet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DrawerFooter className="flex gap-2 p-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange?.(false);
              onCancel?.();
            }}
            disabled={createAccount.isPending}
            className="flex-1 w-full"
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createAccount.isPending} className="flex-1">
            Create
          </Button>
        </DrawerFooter>
      </form>
    </Form>
  );

  if (typeof open !== 'undefined' && onOpenChange) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction={direction} dismissible={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New account</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return content;
}
