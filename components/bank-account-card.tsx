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
  // QUERY: contas com saldo
  const { data: accounts, } = trpc.accounts.getAllWithBalance.useQuery({
    includeArchived: false,
  });

  // STATE: dialog de criação
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit_card' | 'ewallet' | 'other'>('bank');
  const [currency, setCurrency] = useState('BRL');

  // MUTATION: criar conta
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

          {/* <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Your accounts</h3>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-3">
                      <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {accounts.map((account) => (
                  <Card
                    key={account.id}
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconWallet className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-xs capitalize text-muted-foreground">
                              {account.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatCentsBRL(account.balance ?? 0)}
                          </div>
                          <Badge
                            variant={account.isArchived ? 'outline' : 'secondary'}
                            className="ml-auto mt-1 text-xs"
                          >
                            {account.isArchived ? 'Archived' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created {new Date(account.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <IconWallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No accounts yet</p>
                  <Button size="sm" className="mt-2" onClick={() => setOpenCreate(true)}>
                    <IconPlus className="mr-1 h-4 w-4" />
                    Add Account
                  </Button>
                </CardContent>
              </Card>
            )}
          </div> */}
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
