'use client';

import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, CategoryBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CategoryFromTRPC } from '@/types/trpc';

interface CategoryColumnsProps {
  handleViewCategory: (category: CategoryFromTRPC) => void;
  handleEditCategory: (category: CategoryFromTRPC) => void;
  handleDeleteCategory: (category: CategoryFromTRPC) => void;
  getParentCategoryName: (parentId: string | null | undefined) => string | null;
}

export const categoryColumns = ({
  handleViewCategory,
  handleEditCategory,
  handleDeleteCategory,
  getParentCategoryName,
}: CategoryColumnsProps): ColumnDef<CategoryFromTRPC>[] => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-2">
            <CategoryBadge color={category.color || '#000'} name={category.name} />
          </div>
        );
      },
    },
    {
      accessorKey: 'flow',
      header: 'Flow',
      cell: ({ row }) => {
        const flow = String(row.getValue('flow') ?? 'expense');
        const label = flow.charAt(0).toUpperCase() + flow.slice(1);
        return (
          <Badge variant={flow === 'income' ? 'default' : 'secondary'}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'parentId',
      header: 'Parent Category',
      cell: ({ row }) => {
        const parentId = row.getValue('parentId') as string | null | undefined;
        const parentName = getParentCategoryName(parentId);
        if (!parentName) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="outline">{parentName}</Badge>;
      },
    },
    {
      accessorKey: 'isArchived',
      header: 'Status',
      cell: ({ row }) => {
        const isArchived = row.getValue('isArchived') as boolean;
        return (
          <Badge variant={isArchived ? 'destructive' : 'default'}>
            {isArchived ? 'Archived' : 'Active'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const createdAt = row.getValue('createdAt') as string | Date | null | undefined;
        return (
          <div className="text-sm text-muted-foreground">
            {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
          </div>
        );
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
            onClick={() => handleViewCategory(row.original)}
            title="View category"
          >
            <IconEye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCategory(row.original)}
            title="Edit category"
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCategory(row.original)}
            title="Delete category"
            className="text-destructive hover:text-destructive"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
