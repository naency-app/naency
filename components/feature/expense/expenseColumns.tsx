import { IconCalendar, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, CategoryBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { formatCentsBRL } from '@/helps/formatCurrency';
import { formatDate } from '@/helps/formatDate';
import type { ExpenseFromTRPC } from '@/types/trpc';

export const expenseColumns = ({
  handleViewExpense,
  handleEditExpense,
  handleDeleteExpense,
  getAccountName,
  getCategoryName,
}: {
  handleViewExpense: (expense: ExpenseFromTRPC) => void;
  handleEditExpense: (expense: ExpenseFromTRPC) => void;
  handleDeleteExpense: (expense: ExpenseFromTRPC) => void;
  getAccountName: (accountId: string | null | undefined) => string | null;
  getCategoryName: (
    categoryId: string | null | undefined
  ) => { name: string; color: string } | null;
}): ColumnDef<ExpenseFromTRPC>[] => {
  return [
    {
      accessorKey: 'paidAt',
      header: 'Payment date',
      cell: ({ row }) => {
        const paidAt = row.getValue('paidAt') as string | Date | null | undefined;
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconCalendar className="h-4 w-4" />
            {formatDate(paidAt)}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        return <div className="font-mono font-semibold text-destructive">{formatCentsBRL(amount)}</div>;
      },
    },
    {
      accessorKey: 'name',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate capitalize" title={row.getValue('name')}>
          {row.getValue('name')}
        </div>
      ),
    },
    // ---- NOVO: conta unificada ----
    {
      accessorKey: 'accountId',
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
        const categoryId = row.getValue('categoryId') as string | null | undefined;
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
            onClick={() => handleViewExpense(row.original)}
            title="View income"
          >
            <IconEye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditExpense(row.original)}
            title="Edit income"
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteExpense(row.original)}
            title="Delete income"
            className="text-destructive hover:text-destructive"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
};
