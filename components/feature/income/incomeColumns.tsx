'use client';

import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/helps/formatCurrency';
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
      header: 'Received Date',
      cell: ({ row }) => {
        const date = row.getValue('receivedAt') as Date;
        return formatDate(date);
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-medium text-green-600">{formatCurrency(row.getValue('amount'))}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue('description')}>
          {row.getValue('description')}
        </div>
      ),
    },

    {
      accessorKey: 'categoryId',
      header: 'Category',
      cell: ({ row }) => {
        const categoryId = row.getValue('categoryId') as string | null;
        const category = getCategoryName(categoryId);

        if (!category) {
          return <span className="text-muted-foreground">No category</span>;
        }

        return (
          <Badge
            variant="secondary"
            className="max-w-[120px] truncate"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'receivingAccountId',
      header: 'Receiving Account',
      cell: ({ row }) => {
        const receivingAccountId = row.getValue('receivingAccountId') as string | null | undefined;
        const receivingAccount = getReceivingAccountName(receivingAccountId);
        if (!receivingAccount) return '-';
        return <Badge variant="outline">{receivingAccount}</Badge>;
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
