'use client';

import { IconBuildingBank, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { AccountForm } from '@/components/feature/account/account-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Drawer import retained via AccountForm usage
import { useIsMobile } from '@/hooks/use-mobile';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { CardStack } from './card-stack';

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
  const { data: accounts, isLoading } = trpc.accounts.getAllWithBalance.useQuery({
    includeArchived: false,
  });

  const [openCreate, setOpenCreate] = useState(false);

  const activeCount = accounts?.filter((a) => !a.isArchived).length ?? 0;

  return (
    <>
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle>Bank accounts</CardTitle>
          <CardDescription>Overview of your balances</CardDescription>
        </CardHeader>

        <CardContent className="h-full space-y-6">
          <CardStack setOpenCreate={setOpenCreate} accounts={accounts ?? []} isLoading={isLoading} />

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

      <AccountForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        direction={isMobile ? 'bottom' : 'right'}
        onSuccess={() => {
          utils.accounts.getAllWithBalance.invalidate();
          setOpenCreate(false);
        }}
      />
    </>
  );
}
