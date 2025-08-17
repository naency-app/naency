import { Badge, CategoryBadge } from "@/components/ui/badge";
import { formatCentsBRL } from "@/helps/formatCurrency";
import { formatDate } from "@/helps/formatDate";
import { Expense } from "@/types/trpc";
import { IconCalendar, IconDotsVertical, IconEdit, IconEye, IconTrash } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";


export const expenseColumns = ({
  handleViewExpense,
  handleEditExpense,
  handleDeleteExpense,
  getPaidByName,
  getCategoryName,
}: {
  handleViewExpense: (expense: Expense) => void;
  handleEditExpense: (expense: Expense) => void;
  handleDeleteExpense: (expense: Expense) => void;
  getPaidByName: (paidById: string | null | undefined) => string | null;
  getCategoryName: (categoryId: string | null | undefined) => { name: string; color: string } | null;
}): ColumnDef<Expense>[] => {
  return [
    {
      accessorKey: "paidAt",
      header: "Payment date",
      cell: ({ row }) => {
        const paidAt = row.getValue("paidAt") as string | Date | null | undefined
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconCalendar className="h-4 w-4" />
            {formatDate(paidAt)}
          </div>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return (
          <div className="font-mono font-semibold text-red-600 dark:text-red-400">
            {formatCentsBRL(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Description",
      cell: ({ row }) => (
        <div
          className="font-medium cursor-pointer hover:text-primary transition-colors"
          onClick={() => handleViewExpense(row.original)}
        >
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "paidById",
      header: "Paid by",
      cell: ({ row }) => {
        const paidById = row.getValue("paidById") as string | null | undefined
        const paidBy = getPaidByName(paidById)
        if (!paidBy) return '-'
        return (
          <Badge variant="outline" >
            {paidBy}
          </Badge>
        )
      },
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const categoryId = row.getValue("categoryId") as string | null | undefined
        const category = getCategoryName(categoryId)
        if (!category) return '-'
        return (
          <CategoryBadge color={category.color} name={category.name} />
        )
      },
    },

    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewExpense(row.original)}>
              <IconEye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditExpense(row.original)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDeleteExpense(row.original)}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}