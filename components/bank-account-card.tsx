'use client';

import { IconBuildingBank, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { CardStack } from './card-stack';
import { Label } from './ui/label';

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-700/[0.2] dark:text-emerald-500 px-1 py-0.5',
        className
      )}
    >
      {children}
    </span>
  );
};

export function BankAccountCard() {
  const utils = trpc.useUtils();
  const isMobile = useIsMobile();
  const { data: accounts, } = trpc.accounts.getAllWithBalance.useQuery({
    includeArchived: false,
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other'>('bank');
  const [currency, setCurrency] = useState('BRL');

  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: () => {
      toast.success('Account created!');
      utils.accounts.getAllWithBalance.invalidate();
      setOpenCreate(false);
      setName('');
      setType('bank');
      setCurrency('BRL');
    },
    onError: (err) => {
      toast.error(err.message || 'Error creating account');
    },
  });

  const activeCount = accounts?.filter((a) => !a.isArchived).length ?? 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <>
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle>Bank accounts</CardTitle>
          <CardDescription>Overview of your balances</CardDescription>
        </CardHeader>

        <CardContent className="h-full space-y-6">
          <CardStack setOpenCreate={setOpenCreate} />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Quick actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setOpenCreate(true)}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                New account
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <IconBuildingBank className="mr-2 h-4 w-4" />
                Transfer funds
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Account stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active accounts</span>
                <span className="font-medium">{activeCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total transactions</span>
                <span className="font-medium">—</span>
              </div>
            </div>
          </div>


        </CardContent>
      </Card>

      <Drawer
        open={openCreate}
        onOpenChange={setOpenCreate}
        direction={isMobile ? 'bottom' : 'right'}
        dismissible={false}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New account</DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleCreate} className="space-y-3 p-4">
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
                onValueChange={(v) =>
                  setType(v as 'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other')
                }
                disabled={createAccount.isPending}
              >
                <SelectTrigger className='w-full'>
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

            <DrawerFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreate(false)}
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
        </DrawerContent>
      </Drawer>
    </>
  );
}
