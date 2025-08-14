"use client"

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { toast } from "sonner";

import { type Category, type Expense } from "@/types/trpc";
import { TRPCClientErrorLike } from "@trpc/client";
import { Badge } from "@/components/ui/badge";
import { SectionCards } from "@/components/section-cards";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IconDotsVertical, IconDownload, IconPlus, IconTrash, IconCalendar, IconCategory } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ExpensesPage() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");

  const { data: expensesData, isLoading, error } = trpc.expenses.getAll.useQuery();
  const { data: categoriesData } = trpc.categories.getAll.useQuery();
  const utils = trpc.useUtils();
  console.log(expensesData)
  const [expenses, setExpenses] = useState<any[]>([])
  const [selectedExpenses, setSelectedExpenses] = useState<Record<string, boolean>>({})

  // Atualizar estado local quando os dados da API mudarem
  useEffect(() => {
    if (expensesData) {
      setExpenses(expensesData)
    }
  }, [expensesData])

  const handleExpenseDataChange = (newData: any[]) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando despesas...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Erro ao carregar despesas: {error.message}</div>
      </div>
    )
  }

  
  const expenseColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Descrição",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
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
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
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
                    <Button variant="outline" size="sm">
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
                          <Button variant="destructive" size="sm">
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
    </>
  );
}



