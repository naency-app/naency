'use client';

import { IconCalendar, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, CategoryBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCentsBRL } from '@/helps/formatCurrency';
import { formatDate } from '@/helps/formatDate';
import type { IncomeFromTRPC } from '@/types/trpc';

interface IncomeColumnsProps {
  handleViewIncome: (income: IncomeFromTRPC) => void;
  handleEditIncome: (income: IncomeFromTRPC) => void;
  handleDeleteIncome: (income: IncomeFromTRPC) => void;
  getCategoryName: (
    categoryId: string | null | undefined
  ) => { name: string; color: string } | null;
  getAccountName: (accountId: string | null | undefined) => string | null; // <-- unificado
}

export const incomeColumns = ({
  handleViewIncome,
  handleEditIncome,
  handleDeleteIncome,
  getCategoryName,
  getAccountName,
}: IncomeColumnsProps): ColumnDef<IncomeFromTRPC>[] => [
    {
      accessorKey: 'receivedAt',
      header: 'Received date',
      cell: ({ row }) => {
        const receivedAt = row.getValue('receivedAt') as string | Date | null | undefined;
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconCalendar className="h-4 w-4" />
            {formatDate(receivedAt)}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        return <div className="font-mono font-semibold text-success">{formatCentsBRL(amount)}</div>;
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate capitalize" title={row.getValue('description')}>
          {row.getValue('description')}
        </div>
      ),
    },
    {
      accessorKey: 'accountId', // <-- unificado
      header: 'Account',
      cell: ({ row }) => {
        const accountId = row.getValue('accountId') as string | null | undefined;
        const account = getAccountName(accountId);
        if (!account) return '-';
        return <Badge variant="outline">{account}</Badge>;
      },
    },
    {
      accessorKey: 'categoryId',
      header: 'Category',
      cell: ({ row }) => {
        const categoryId = row.getValue('categoryId') as string | null;
        const category = getCategoryName(categoryId);
        if (!category) return '-';
        return <CategoryBadge color={category.color} name={category.name} />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewIncome(row.original)}
            title="View income"
          >
            <IconEye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditIncome(row.original)}
            title="Edit income"
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteIncome(row.original)}
            title="Delete income"
            className="text-destructive hover:text-destructive"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
