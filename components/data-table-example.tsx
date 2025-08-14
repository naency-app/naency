"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconDotsVertical } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "./data-table"

// Exemplo de tipo de dados
interface User {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  createdAt: string
}

// Exemplo de dados
const usersData: User[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@example.com",
    role: "Admin",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@example.com",
    role: "User",
    status: "active",
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Pedro Costa",
    email: "pedro@example.com",
    role: "Moderator",
    status: "inactive",
    createdAt: "2024-01-25",
  },
]

// Definição das colunas
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("role")}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data de Criação",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {new Date(row.getValue("createdAt")).toLocaleDateString("pt-BR")}
      </div>
    ),
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
          <DropdownMenuItem>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// Exemplo de uso básico
export function UsersTable() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tabela de Usuários</h2>
      <DataTable
        data={usersData}
        columns={userColumns}
        enableSearch={true}
        searchPlaceholder="Buscar usuários..."
        enableRowSelection={true}
        enablePagination={true}
        enableColumnVisibility={true}
        showToolbar={true}
        emptyMessage="Nenhum usuário encontrado."
      />
    </div>
  )
}

// Exemplo com drag and drop
export function DraggableUsersTable() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tabela de Usuários (Drag & Drop)</h2>
      <DataTable
        data={usersData}
        columns={userColumns}
        enableDragAndDrop={true}
        enableSearch={true}
        searchPlaceholder="Buscar usuários..."
        enableRowSelection={true}
        enablePagination={true}
        enableColumnVisibility={true}
        showToolbar={true}
        emptyMessage="Nenhum usuário encontrado."
        onDataChange={(newData) => {
          console.log("Dados reordenados:", newData)
        }}
      />
    </div>
  )
}

// Exemplo sem algumas funcionalidades
export function SimpleUsersTable() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tabela Simples</h2>
      <DataTable
        data={usersData}
        columns={userColumns}
        enableSearch={false}
        enableRowSelection={false}
        enablePagination={false}
        enableColumnVisibility={false}
        showToolbar={false}
        emptyMessage="Nenhum usuário encontrado."
      />
    </div>
  )
}

// Exemplo com ações customizadas na toolbar
export function UsersTableWithActions() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tabela com Ações</h2>
      <DataTable
        data={usersData}
        columns={userColumns}
        enableSearch={true}
        searchPlaceholder="Buscar usuários..."
        enableRowSelection={true}
        enablePagination={true}
        enableColumnVisibility={true}
        showToolbar={true}
        toolbarActions={
          <div className="flex items-center gap-2">
            <Button size="sm">
              Adicionar Usuário
            </Button>
            <Button variant="outline" size="sm">
              Exportar
            </Button>
          </div>
        }
        emptyMessage="Nenhum usuário encontrado."
      />
    </div>
  )
}
