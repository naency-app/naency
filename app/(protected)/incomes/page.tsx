'use client';

import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreateFormsWrapper } from '@/components/create-forms-wrapper';
import { DataTable } from '@/components/data-table';
import { IncomeCards } from '@/components/feature/income/income-cards';
import { IncomeForm } from '@/components/feature/income/income-form';
import { incomeColumns } from '@/components/feature/income/incomeColumns';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar';
// Drawer is now handled within IncomeForm itself
import { useDateFilter } from '@/hooks/use-date-filter';
import { trpc } from '@/lib/trpc';
import type { CreateIncomeInput, IncomeFromTRPC } from '@/types/trpc';

export default function IncomesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeFromTRPC | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeFromTRPC | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { isMobile } = useSidebar();
  const { dateRange } = useDateFilter();

  const { data: incomesData, isLoading: incomesLoading } = trpc.incomes.getAll.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });
  const { data: categoriesData, isLoading: categoriesLoading } = trpc.categories.getAll.useQuery();
  const { data: accountsData, isLoading: accountsLoading } = trpc.accounts.getAll.useQuery(); // <-- unificado
  const utils = trpc.useUtils();

  const createIncome = trpc.incomes.create.useMutation({
    onSuccess: () => {
      toast.success('Income created successfully!');
      utils.incomes.getAll.invalidate();
      utils.incomes.getTotal.refetch();
      setIsDrawerOpen(false);
      setEditingIncome(null);
    },
    onError: (error) => toast.error(`Error creating income: ${error.message}`),
  });

  const updateIncome = trpc.incomes.update.useMutation({
    onSuccess: () => {
      toast.success('Income updated successfully!');
      utils.incomes.getAll.invalidate();
      utils.incomes.getTotal.refetch();
      setIsDrawerOpen(false);
      setEditingIncome(null);
    },
    onError: (error) => toast.error(`Error updating income: ${error.message}`),
  });

  const deleteIncome = trpc.incomes.delete.useMutation({
    onSuccess: () => {
      toast.success('Income deleted successfully!');
      utils.incomes.getAll.invalidate();
      utils.incomes.getTotal.refetch();
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    },
    onError: (error) => toast.error(`Error deleting income: ${error.message}`),
  });

  const deleteManyIncomes = trpc.incomes.deleteMany.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIncomesCount} incomes deleted successfully!`);
      utils.incomes.getAll.invalidate();
      utils.incomes.getTotal.refetch();
      setBulkDeleteDialogOpen(false);
      setSelectedIncomes({});
    },
    onError: (error) => toast.error(`Error deleting incomes: ${error.message}`),
  });

  const [incomes, setIncomes] = useState<IncomeFromTRPC[]>([]);
  const [selectedIncomes, setSelectedIncomes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (incomesData) {
      setIncomes(
        incomesData
      );
    }
  }, [incomesData]);

  const handleIncomeDataChange = (newData: IncomeFromTRPC[]) => setIncomes(newData);
  const handleIncomeSelectionChange = (selection: Record<string, boolean>) =>
    setSelectedIncomes(selection);

  const selectedIncomesCount = Object.values(selectedIncomes).filter(Boolean).length;

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId || !categoriesData) return null;
    const category = categoriesData.find((cat) => cat.id === categoryId);
    return { name: category?.name || 'No category', color: category?.color || '#000' };
  };

  const getAccountName = (accountId: string | null | undefined) => {
    if (!accountId || !accountsData) return null;
    const acc = accountsData.find((a) => a.id === accountId);
    return acc?.name || null;
  };

  const handleCreateIncome = () => {
    setEditingIncome(null);
    setIsDrawerOpen(true);
  };

  const handleEditIncome = (income: IncomeFromTRPC) => {
    setEditingIncome(income);
    setIsDrawerOpen(true);
  };

  const handleViewIncome = (income: IncomeFromTRPC) => {
    setEditingIncome(income);
    setIsDrawerOpen(true);
  };

  const handleDeleteIncome = (income: IncomeFromTRPC) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => setBulkDeleteDialogOpen(true);

  const confirmDeleteIncome = async () => {
    if (incomeToDelete) await deleteIncome.mutateAsync({ id: incomeToDelete.id });
  };

  const confirmBulkDelete = async () => {
    const selectedIds = Object.keys(selectedIncomes).filter((id) => selectedIncomes[id]);
    if (selectedIds.length > 0) await deleteManyIncomes.mutateAsync({ ids: selectedIds });
  };

  // payloads agora usam accountId (obrigatório)
  const handleFormSubmit = async (data: {
    description: string;
    amount: number;
    categoryId?: string | null;
    accountId: string; // <-- obrigatório
    receivedAt?: Date;
    paymentMethod: CreateIncomeInput['paymentMethod'];
  }) => {
    if (editingIncome) {
      await updateIncome.mutateAsync({
        id: editingIncome.id,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        accountId: data.accountId,
        receivedAt: data.receivedAt ? data.receivedAt.toISOString() : undefined,
        paymentMethod: data.paymentMethod,
      });
    } else {
      await createIncome.mutateAsync({
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId || undefined,
        accountId: data.accountId,
        receivedAt: data.receivedAt ? data.receivedAt.toISOString() : undefined,
        paymentMethod: data.paymentMethod,
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingIncome(null);
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <IncomeCards />
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Income management</CardTitle>
                      <CardDescription>Here you can manage your incomes</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreateFormsWrapper
                        context="income"
                        onSuccess={() => {
                          utils.categories.getAll.invalidate();
                          utils.accounts.getAll.invalidate(); // <-- unificado
                        }}
                      />
                      <Button size="sm" onClick={handleCreateIncome}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add income
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={incomes}
                    columns={incomeColumns({
                      handleViewIncome,
                      handleEditIncome,
                      handleDeleteIncome,
                      getCategoryName,
                      getAccountName,
                    })}
                    storageKey="naency:incomes-table"
                    loading={incomesLoading || categoriesLoading || accountsLoading}
                    enableDragAndDrop={true}
                    enableSearch={true}
                    searchPlaceholder="Search"
                    enableRowSelection={true}
                    enablePagination={true}
                    enableColumnVisibility={true}
                    showToolbar={true}
                    toolbarActions={
                      <div className="flex items-center gap-2">
                        {selectedIncomesCount > 0 && (
                          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete ({selectedIncomesCount})
                          </Button>
                        )}
                      </div>
                    }
                    emptyMessage="No incomes found."
                    onDataChange={handleIncomeDataChange}
                    onRowSelectionChange={handleIncomeSelectionChange}
                    onRowClick={(row) => handleViewIncome(row.original)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {categoriesData && accountsData && (
        <IncomeForm
          income={editingIncome || undefined}
          accounts={accountsData}
          onSubmit={handleFormSubmit}
          onCancel={handleDrawerClose}
          isLoading={createIncome.isPending || updateIncome.isPending}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          direction={isMobile ? 'bottom' : 'right'}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the income &quot;{incomeToDelete?.description}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteIncome}
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
              Are you sure you want to delete {selectedIncomesCount} selected incomes? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete {selectedIncomesCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
