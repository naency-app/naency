'use client';

import { IconBuildingBank, IconPlus, IconWallet } from '@tabler/icons-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/helps/formatCurrency';
import { trpc } from '@/lib/trpc';

export function BankAccountCard() {

  const { data: accounts, isLoading } = trpc.transactionAccount.getAll.useQuery();
  console.log(accounts);
  const totalBalance =
    accounts?.reduce((sum: number, account: any) => {
      return sum + account.balance;
    }, 0) || 0;

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Bank accounts</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 h-full">

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CardDescription>Across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalBalance.toString())}</div>
            <Badge variant="secondary" className="mt-2">
              {accounts?.length || 0} accounts
            </Badge>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <IconPlus className="h-4 w-4 mr-2" />
              New Account
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <IconBuildingBank className="h-4 w-4 mr-2" />
              Transfer Funds
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Account Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active Accounts:</span>
              <span className="font-medium">{accounts?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Transactions:</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>


        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Your accounts</h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div>
              {accounts.map((account: any) => (
                <Card
                  key={account.id}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconWallet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{account.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Created {new Date(account.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <IconWallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No accounts yet</p>
                <Button size="sm" className="mt-2">
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
