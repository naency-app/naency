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
import { Badge } from "@/components/ui/badge";
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

export default function ExpensesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { isMobile } = useSidebar()
  const { data: expensesData, isLoading, error } = trpc.expenses.getAll.useQuery();
  const { data: categoriesData } = trpc.categories.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Despesa criada com sucesso!");
      utils.expenses.getAll.invalidate();
      setIsDrawerOpen(false);
      setEditingExpense(null);
    },
    onError: (error) => {
      toast.error(`Erro ao criar despesa: ${error.message}`);
    },
  });

  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success("Despesa atualizada com sucesso!");
      utils.expenses.getAll.invalidate();
      setIsDrawerOpen(false);
      setEditingExpense(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });

  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Despesa excluída com sucesso!");
      utils.expenses.getAll.invalidate();
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir despesa: ${error.message}`);
    },
  });

  const deleteManyExpenses = trpc.expenses.deleteMany.useMutation({
    onSuccess: () => {
      toast.success(`${selectedExpensesCount} despesas excluídas com sucesso!`);
      utils.expenses.getAll.invalidate();
      setBulkDeleteDialogOpen(false);
      setSelectedExpenses({});
    },
    onError: (error) => {
      toast.error(`Erro ao excluir despesas: ${error.message}`);
    },
  });

  console.log(expensesData)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedExpenses, setSelectedExpenses] = useState<Record<string, boolean>>({})

  // Atualizar estado local quando os dados da API mudarem
  useEffect(() => {
    if (expensesData) {
      setExpenses(expensesData.map(expense => ({
        ...expense,
        categoryId: expense.categoryId || undefined,
        paidAt: expense.paidAt ? new Date(expense.paidAt) : undefined,
        createdAt: expense.createdAt ? new Date(expense.createdAt) : undefined
      })))
    }
  }, [expensesData])

  const handleExpenseDataChange = (newData: Expense[]) => {
    setExpenses(newData)
    console.log("Despesas reordenadas:", newData)
  }

  const handleExpenseSelectionChange = (selection: Record<string, boolean>) => {
    setSelectedExpenses(selection)
    console.log("Seleção de despesas:", selection)
  }

  const selectedExpensesCount = Object.values(selectedExpenses).filter(Boolean).length

  // Funções auxiliares
  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId || !categoriesData) return "Sem categoria"
    const category = categoriesData.find(cat => cat.id === categoryId)
    return category?.name || "Categoria não encontrada"
  }

  const formatCurrency = (amount: string) => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount)) return "R$ 0,00"
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericAmount)
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

  const handleFormSubmit = async (data: { name: string; amount: string; categoryId?: string; paidAt?: Date }) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        ...data,
      });
    } else {
      await createExpense.mutateAsync(data);
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingExpense(null);
  };

  

  const expenseColumns: ColumnDef<Expense>[] = [
    {
      accessorKey: "name",
      header: "Descrição",
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
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as string
        return (
          <div className="font-mono font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: "categoryId",
      header: "Categoria",
      cell: ({ row }) => {
        const categoryId = row.getValue("categoryId") as string | null | undefined
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <IconCategory className="h-3 w-3" />
            {getCategoryName(categoryId)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "paidAt",
      header: "Data de pagamento",
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
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewExpense(row.original)}>
              <IconEye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditExpense(row.original)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive"
              onClick={() => handleDeleteExpense(row.original)}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Excluir
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
                  <CardTitle>Gerenciamento de Despesas</CardTitle>
                  <CardDescription>
                    Tabela com drag & drop, seleção de linhas e ações customizadas
                  </CardDescription>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={handleCreateExpense}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Adicionar Despesa
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={expenses}
                    columns={expenseColumns}
                    enableDragAndDrop={true}
                    enableSearch={true}
                    searchPlaceholder="Buscar despesas..."
                    enableRowSelection={true}
                    enablePagination={true}
                    enableColumnVisibility={true}
                    showToolbar={true}
                    toolbarActions={
                      <div className="flex items-center gap-2">
                        {selectedExpensesCount > 0 && (
                          <>
                            <Button variant="outline" size="sm">
                              <IconDownload className="mr-2 h-4 w-4" />
                              Exportar ({selectedExpensesCount})
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={handleBulkDelete}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Excluir ({selectedExpensesCount})
                            </Button>
                          </>
                        )}
                      </div>
                    }
                    emptyMessage="Nenhuma despesa encontrada."
                    onDataChange={handleExpenseDataChange}
                    onRowSelectionChange={handleExpenseSelectionChange}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer para criar/editar despesa */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction={isMobile ? "bottom" : "right"} >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingExpense ? "Editar Despesa" : "Nova Despesa"}
            </DrawerTitle>
            <DrawerDescription>
              {editingExpense 
                ? "Atualize as informações da despesa selecionada."
                : "Preencha as informações para criar uma nova despesa."
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
                onSubmit={handleFormSubmit}
                onCancel={handleDrawerClose}
                isLoading={createExpense.isPending || updateExpense.isPending}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialog de confirmação para deletar uma despesa */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
                          Tem certeza que deseja excluir a despesa &quot;{expenseToDelete?.name}&quot;? 
            Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para deletar múltiplas despesas */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedExpensesCount} despesas selecionadas? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedExpensesCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}



