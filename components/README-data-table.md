# DataTable Component

O `DataTable` é um componente de tabela agnóstico e reutilizável baseado no TanStack Table (React Table) com suporte a várias funcionalidades.

## Características

- ✅ **Agnóstico**: Aceita qualquer tipo de dados
- ✅ **Colunas customizáveis**: Defina suas próprias colunas usando `ColumnDef`
- ✅ **Drag & Drop**: Suporte opcional para reordenação de linhas
- ✅ **Seleção de linhas**: Checkbox para seleção individual e em massa
- ✅ **Paginação**: Navegação entre páginas com tamanhos configuráveis
- ✅ **Busca global**: Campo de busca que filtra em todas as colunas
- ✅ **Visibilidade de colunas**: Menu dropdown para mostrar/ocultar colunas
- ✅ **Toolbar customizável**: Adicione ações personalizadas
- ✅ **Responsivo**: Funciona bem em dispositivos móveis e desktop

## Uso Básico

```tsx
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"

interface User {
  id: string
  name: string
  email: string
  role: string
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Função",
  },
]

const users: User[] = [
  { id: "1", name: "João", email: "joao@example.com", role: "Admin" },
  { id: "2", name: "Maria", email: "maria@example.com", role: "User" },
]

export function UsersTable() {
  return (
    <DataTable
      data={users}
      columns={columns}
    />
  )
}
```

## Props

### Obrigatórias

- `data`: Array de dados para exibir na tabela
- `columns`: Array de definições de colunas (`ColumnDef<TData>[]`)

### Opcionais

- `enableDragAndDrop`: Habilita drag & drop para reordenação (padrão: `false`)
- `enableRowSelection`: Habilita seleção de linhas (padrão: `true`)
- `enablePagination`: Habilita paginação (padrão: `true`)
- `enableColumnVisibility`: Habilita menu de visibilidade de colunas (padrão: `true`)
- `enableSearch`: Habilita campo de busca global (padrão: `true`)
- `searchPlaceholder`: Placeholder do campo de busca (padrão: `"Search..."`)
- `showToolbar`: Mostra a barra de ferramentas (padrão: `true`)
- `toolbarActions`: Conteúdo customizado para a toolbar
- `emptyMessage`: Mensagem quando não há dados (padrão: `"No results."`)
- `pageSizeOptions`: Opções de tamanho de página (padrão: `[10, 20, 30, 40, 50]`)
- `defaultPageSize`: Tamanho padrão da página (padrão: `10`)
- `className`: Classes CSS adicionais
- `onDataChange`: Callback quando dados são reordenados (drag & drop)
- `onRowSelectionChange`: Callback quando seleção de linhas muda

## Exemplos de Uso

### Tabela Simples

```tsx
<DataTable
  data={users}
  columns={userColumns}
  enableSearch={false}
  enableRowSelection={false}
  enablePagination={false}
  showToolbar={false}
/>
```

### Tabela com Drag & Drop

```tsx
<DataTable
  data={users}
  columns={userColumns}
  enableDragAndDrop={true}
  onDataChange={(newData) => {
    console.log("Dados reordenados:", newData)
    // Atualizar estado ou fazer chamada à API
  }}
/>
```

### Tabela com Ações Customizadas

```tsx
<DataTable
  data={users}
  columns={userColumns}
  toolbarActions={
    <div className="flex items-center gap-2">
      <Button size="sm">Adicionar</Button>
      <Button variant="outline" size="sm">Exportar</Button>
    </div>
  }
/>
```

### Tabela com Configurações Personalizadas

```tsx
<DataTable
  data={users}
  columns={userColumns}
  enableSearch={true}
  searchPlaceholder="Buscar usuários..."
  enableRowSelection={true}
  enablePagination={true}
  enableColumnVisibility={true}
  showToolbar={true}
  emptyMessage="Nenhum usuário encontrado."
  pageSizeOptions={[5, 10, 25, 50]}
  defaultPageSize={25}
  className="my-custom-table"
/>
```

## Definição de Colunas

As colunas são definidas usando `ColumnDef<TData>` do TanStack Table:

```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name", // Chave do objeto de dados
    header: "Nome", // Cabeçalho da coluna
    cell: ({ row }) => ( // Renderização customizada da célula
      <div className="font-medium">{row.getValue("name")}</div>
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
    id: "actions", // ID único para colunas sem accessorKey
    header: "Ações",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <IconDotsVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
```

## Funcionalidades

### Drag & Drop

Quando `enableDragAndDrop={true}`, a tabela adiciona automaticamente uma coluna de drag handle e permite reordenação de linhas.

### Seleção de Linhas

Quando `enableRowSelection={true}`, a tabela adiciona uma coluna de checkbox para seleção individual e em massa.

### Busca Global

O campo de busca filtra em todas as colunas visíveis da tabela.

### Paginação

Navegação entre páginas com controles de primeira, anterior, próxima e última página.

### Visibilidade de Colunas

Menu dropdown para mostrar/ocultar colunas específicas.

## Dependências

- `@tanstack/react-table` - Funcionalidade principal da tabela
- `@dnd-kit/*` - Drag & drop (quando habilitado)
- `@tabler/icons-react` - Ícones
- Componentes UI do shadcn/ui

## Migração do Componente Anterior

Se você estava usando o `DataTableExpense`, pode migrar facilmente:

1. Substitua as colunas hardcoded por suas próprias definições
2. Passe os dados via prop `data`
3. Configure as funcionalidades desejadas via props
4. Use `onDataChange` para capturar mudanças nos dados
