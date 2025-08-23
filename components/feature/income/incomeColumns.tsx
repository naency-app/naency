'use client';

import { IconCalendar, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, CategoryBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCentsBRL, formatCurrency } from '@/helps/formatCurrency';
import { formatDate } from '@/helps/formatDate';
import type { Income } from '@/types/trpc';

interface IncomeColumnsProps {
  handleViewIncome: (income: Income) => void;
  handleEditIncome: (income: Income) => void;
  handleDeleteIncome: (income: Income) => void;
  getCategoryName: (
    categoryId: string | null | undefined
  ) => { name: string; color: string } | null;
  getReceivingAccountName: (accountId: string | null | undefined) => string | null;
}

export const incomeColumns = ({
  handleViewIncome,
  handleEditIncome,
  handleDeleteIncome,
  getCategoryName,
  getReceivingAccountName,
}: IncomeColumnsProps): ColumnDef<Income>[] => [
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
        return (
          <div className="font-mono font-semibold text-success">
            {formatCentsBRL(amount)}
          </div>
        );
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
      accessorKey: 'receivingAccountId',
      header: 'Receiving account',
      cell: ({ row }) => {
        const receivingAccountId = row.getValue('receivingAccountId') as string | null | undefined;
        const receivingAccount = getReceivingAccountName(receivingAccountId);
        if (!receivingAccount) return '-';
        return <Badge variant="outline">{receivingAccount}</Badge>;
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
