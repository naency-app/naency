'use client';

import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreateFormsWrapper } from '@/components/create-forms-wrapper';
import { DataTable } from '@/components/data-table';
import DateRangeFilter from '@/components/date-range-filter';
import { ExpenseForm } from '@/components/expense-form';
import { ExpenseCards } from '@/components/feature/expense/expense-cards';
import { expenseColumns } from '@/components/feature/expense/expenseColumns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useSidebar } from '@/components/ui/sidebar';
import { useDateFilter } from '@/hooks/use-date-filter';
import { trpc } from '@/lib/trpc';
import type { Expense } from '@/types/trpc';

export default function ExpensesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { isMobile } = useSidebar();
  const { dateRange } = useDateFilter();

  const { data: expensesData } = trpc.expenses.getAll.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });
  const { data: categoriesData } = trpc.categories.getAll.useQuery();
  const { data: paidByData } = trpc.paidBy.getAll.useQuery();
  const { data: transactionAccountsData } = trpc.transactionAccount.getAll.useQuery();
  const utils = trpc.useUtils();

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success('Expense created successfully!');
      utils.expenses.getAll.invalidate();
      utils.expenses.getTotal.refetch();
      setIsDrawerOpen(false);
      setEditingExpense(null);
    },
    onError: (error) => {
      toast.error(`Error creating expense: ${error.message}`);
    },
  });

  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success('Expense updated successfully!');
      utils.expenses.getAll.invalidate();
      utils.expenses.getTotal.refetch();
      setIsDrawerOpen(false);
      setEditingExpense(null);
    },
    onError: (error) => {
      toast.error(`Error updating expense: ${error.message}`);
    },
  });

  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success('Expense deleted successfully!');
      utils.expenses.getAll.invalidate();
      utils.expenses.getTotal.refetch();
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
      utils.expenses.getTotal.refetch();
      setBulkDeleteDialogOpen(false);
      setSelectedExpenses({});
    },
    onError: (error) => {
      toast.error(`Error deleting expenses: ${error.message}`);
    },
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (expensesData) {
      setExpenses(
        expensesData.map((expense) => ({
          ...expense,
          categoryId: expense.categoryId || undefined,
          paidById: expense.paidById || undefined,
          transactionAccountId: expense.transactionAccountId || undefined,
          paidAt: expense.paidAt ? new Date(expense.paidAt) : undefined,
          createdAt: expense.createdAt ? new Date(expense.createdAt) : undefined,
        }))
      );
    }
  }, [expensesData]);

  const handleExpenseDataChange = (newData: Expense[]) => {
    setExpenses(newData);
  };

  const handleExpenseSelectionChange = (selection: Record<string, boolean>) => {
    setSelectedExpenses(selection);
  };

  const selectedExpensesCount = Object.values(selectedExpenses).filter(Boolean).length;

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId || !categoriesData) return null;
    const category = categoriesData.find((cat) => cat.id === categoryId);
    return { name: category?.name || 'No category', color: category?.color || '#000' };
  };

  const getPaidByName = (paidById: string | null | undefined) => {
    if (!paidById || !paidByData) return null;
    const paidBy = paidByData.find((paidBy) => paidBy.id === paidById);
    return paidBy?.name || null;
  };

  const getTransactionAccountName = (transactionAccountId: string | null | undefined) => {
    if (!transactionAccountId || !transactionAccountsData) return null;
    const transactionAccount = transactionAccountsData.find((account) => account.id === transactionAccountId);
    return transactionAccount?.name || null;
  };

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
    const selectedIds = Object.keys(selectedExpenses).filter((id) => selectedExpenses[id]);
    if (selectedIds.length > 0) {
      await deleteManyExpenses.mutateAsync({ ids: selectedIds });
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    amount: number;
    categoryId?: string | null;
    paidById?: string | null;
    transactionAccountId?: string | null;
    paidAt?: Date;
  }) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        name: data.name,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        paidById: data.paidById || undefined,
        transactionAccountId: data.transactionAccountId || undefined,
        paidAt: data.paidAt ? data.paidAt.toISOString() : undefined,
      });
    } else {
      await createExpense.mutateAsync({
        name: data.name,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        paidById: data.paidById || undefined,
        transactionAccountId: data.transactionAccountId || undefined,
        paidAt: data.paidAt ? data.paidAt.toISOString() : undefined,
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingExpense(null);
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ExpenseCards />
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Expense management</CardTitle>
                      <CardDescription>Here you can manage your expenses</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreateFormsWrapper
                        context="expense"
                        onSuccess={() => {
                          utils.categories.getAll.invalidate();
                          utils.paidBy.getAll.invalidate();
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={handleCreateExpense}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add expense
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={expenses}
                    columns={expenseColumns({
                      handleViewExpense,
                      handleEditExpense,
                      handleDeleteExpense,
                      getPaidByName,
                      getCategoryName,
                      getTransactionAccountName,
                    })}
                    enableDragAndDrop={true}
                    enableSearch={true}
                    searchPlaceholder="Search"
                    enableRowSelection={true}
                    enablePagination={true}
                    enableColumnVisibility={true}
                    showToolbar={true}
                    toolbarActions={
                      <div className="flex items-center gap-2">
                        {selectedExpensesCount > 0 && (
                          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete ({selectedExpensesCount})
                          </Button>
                        )}
                      </div>
                    }
                    emptyMessage="No expenses found."
                    onDataChange={handleExpenseDataChange}
                    onRowSelectionChange={handleExpenseSelectionChange}
                    onRowClick={(row) => handleViewExpense(row.original)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        direction={isMobile ? 'bottom' : 'right'}
        dismissible={false}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingExpense ? 'Edit expense' : 'Create new expense'}</DrawerTitle>
            <DrawerDescription>
              {editingExpense
                ? 'Update the information for the selected expense.'
                : 'Fill in the information to create a new expense.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {categoriesData && (
              <ExpenseForm
                expense={editingExpense || undefined}
                categories={categoriesData.map((cat) => ({
                  ...cat,
                  color: cat.color || undefined,
                  createdAt: cat.createdAt ? new Date(cat.createdAt) : undefined,
                }))}
                paidBy={paidByData?.map((paidBy) => ({
                  ...paidBy,
                  createdAt: paidBy.createdAt ? new Date(paidBy.createdAt) : undefined,
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
              Are you sure you want to delete the expense &quot;{expenseToDelete?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              className="bg-destructive text-white hover:bg-destructive/90"
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
              Are you sure you want to delete {selectedExpensesCount} selected expenses? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete {selectedExpensesCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
