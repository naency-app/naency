"use client"

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { type Expense } from "@/types/trpc";
import { Badge, CategoryBadge } from "@/components/ui/badge";
import { SectionCards } from "@/components/section-cards";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IconDotsVertical, IconDownload, IconPlus, IconTrash, IconCalendar, IconCategory, IconEdit, IconEye } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpenseForm } from "@/components/expense-form";
import { useSidebar } from "@/components/ui/sidebar";
import { formatCentsBRL, formatCurrency } from "@/helps/formatCurrency";

export default function ExpensesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { isMobile } = useSidebar()
  const { data: expensesData, isLoading, error } = trpc.expenses.getAll.useQuery();
  const { data: categoriesData } = trpc.categories.getAll.useQuery();
  const { data: paidByData } = trpc.paidBy.getAll.useQuery();
  const utils = trpc.useUtils();

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Expense created successfully!");
      utils.expenses.getAll.invalidate();
      setIsDrawerOpen(false);
      setEditingExpense(null);
    },
    onError: (error) => {
      toast.error(`Error creating expense: ${error.message}`);
    },
  });

  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success("Expense updated successfully!");
      utils.expenses.getAll.invalidate();
      setIsDrawerOpen(false);
      setEditingExpense(null);
    },
    onError: (error) => {
      toast.error(`Error updating expense: ${error.message}`);
    },
  });

  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Expense deleted successfully!");
      utils.expenses.getAll.invalidate();
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: (error) => {
      toast.error(`Error deleting expense: ${error.message}`);
    },
  });

  const deleteManyExpenses = trpc.expenses.deleteMany.useMutation({
    onSuccess: () => {
      toast.success(`${selectedExpensesCount} expenses deleted successfully!`);
      utils.expenses.getAll.invalidate();
      setBulkDeleteDialogOpen(false);
      setSelectedExpenses({});
    },
    onError: (error) => {
      toast.error(`Error deleting expenses: ${error.message}`);
    },
  });


  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedExpenses, setSelectedExpenses] = useState<Record<string, boolean>>({})

  // Atualizar estado local quando os dados da API mudarem
  useEffect(() => {
    if (expensesData) {
      setExpenses(expensesData.map(expense => ({
        ...expense,
        categoryId: expense.categoryId || undefined,
        paidById: expense.paidById || undefined,
        paidAt: expense.paidAt ? new Date(expense.paidAt) : undefined,
        createdAt: expense.createdAt ? new Date(expense.createdAt) : undefined
      })))
    }
  }, [expensesData])

  const handleExpenseDataChange = (newData: Expense[]) => {
    setExpenses(newData)
  }

  const handleExpenseSelectionChange = (selection: Record<string, boolean>) => {
    setSelectedExpenses(selection)
  }

  const selectedExpensesCount = Object.values(selectedExpenses).filter(Boolean).length

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId || !categoriesData) return null
    const category = categoriesData.find(cat => cat.id === categoryId)
    return { name: category?.name || "No category", color: category?.color || "#000" }
  }

  const getPaidByName = (paidById: string | null | undefined) => {
    if (!paidById || !paidByData) return null
    const paidBy = paidByData.find(paidBy => paidBy.id === paidById)
    return paidBy?.name
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Data não informada"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data inválida"
    return date.toLocaleDateString('pt-BR')
  }

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setIsDrawerOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDrawerOpen(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDrawerOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (expenseToDelete) {
      await deleteExpense.mutateAsync({ id: expenseToDelete.id });
    }
  };

  const confirmBulkDelete = async () => {
    const selectedIds = Object.keys(selectedExpenses).filter(id => selectedExpenses[id]);
    if (selectedIds.length > 0) {
      await deleteManyExpenses.mutateAsync({ ids: selectedIds });
    }
  };

  const handleFormSubmit = async (data: { name: string; amount: number; categoryId?: string | null; paidById?: string | null; paidAt?: Date }) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        name: data.name,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        paidById: data.paidById || undefined,
        paidAt: data.paidAt ? data.paidAt.toISOString() : undefined,
      });
    } else {
      await createExpense.mutateAsync({
        name: data.name,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        paidById: data.paidById || undefined,
        paidAt: data.paidAt ? data.paidAt.toISOString() : undefined,
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingExpense(null);
  };



  const expenseColumns: ColumnDef<Expense>[] = [
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

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense management</CardTitle>
                  <CardDescription>
                    Here you can manage your expenses.
                  </CardDescription>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={handleCreateExpense}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add expense
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={expenses}
                    columns={expenseColumns}
                    enableDragAndDrop={true}
                    enableSearch={true}
                    searchPlaceholder="Search expenses..."
                    enableRowSelection={true}
                    enablePagination={true}
                    enableColumnVisibility={true}
                    showToolbar={true}
                    toolbarActions={
                      <div className="flex items-center gap-2">
                        {selectedExpensesCount > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete ({selectedExpensesCount})
                          </Button>
                        )}
                      </div>
                    }
                    emptyMessage="No expenses found."
                    onDataChange={handleExpenseDataChange}
                    onRowSelectionChange={handleExpenseSelectionChange}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction={isMobile ? "bottom" : "right"} dismissible={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingExpense ? "Edit Expense" : "New Expense"}
            </DrawerTitle>
            <DrawerDescription>
              {editingExpense
                ? "Update the information for the selected expense."
                : "Fill in the information to create a new expense."
              }
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {categoriesData && (
              <ExpenseForm
                expense={editingExpense || undefined}
                categories={categoriesData.map(cat => ({
                  ...cat,
                  color: cat.color || undefined,
                  createdAt: cat.createdAt ? new Date(cat.createdAt) : undefined
                }))}
                paidBy={paidByData?.map(paidBy => ({
                  ...paidBy,
                  createdAt: paidBy.createdAt ? new Date(paidBy.createdAt) : undefined
                }))}
                onSubmit={handleFormSubmit}
                onCancel={handleDrawerClose}
                isLoading={createExpense.isPending || updateExpense.isPending}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the expense &quot;{expenseToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm bulk deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedExpensesCount} selected expenses?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedExpensesCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}



