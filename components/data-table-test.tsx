"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"

// Tipo simples para teste
interface TestData {
  id: string
  name: string
}

// Dados de teste
const testData: TestData[] = [
  { id: "1", name: "Item 1" },
  { id: "2", name: "Item 2" },
  { id: "3", name: "Item 3" },
]

// Colunas simples
const testColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
]

export function DataTableTest() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Teste da Tabela</h2>
      <DataTable
        data={testData}
        columns={testColumns}
        enableSearch={false}
        enableRowSelection={false}
        enablePagination={false}
        enableColumnVisibility={false}
        showToolbar={false}
      />
    </div>
  )
}
