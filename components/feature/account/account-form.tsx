'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

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
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other'>('bank');
  const [currency] = useState('BRL');

  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: (acc) => {
      toast.success('Account created!');
      utils.accounts.getAll.invalidate();
      utils.accounts.getAllWithBalance.invalidate();
      setName('');
      setType('bank');
      onSuccess?.(acc?.id);
      onOpenChange?.(false);
    },
    onError: (err) => toast.error(err.message || 'Error creating account'),
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter the account name');
      return;
    }
    createAccount.mutate({
      name: name.trim(),
      type,
      currency: currency.toUpperCase() as 'BRL' | string,
    });
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Nubank, Carteira, Cartão XP"
          disabled={createAccount.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Type *</Label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as 'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other')}
          disabled={createAccount.isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="credit_card">Credit card</SelectItem>
            <SelectItem value="ewallet">E-wallet</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
