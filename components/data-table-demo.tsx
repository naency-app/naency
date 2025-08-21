'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Tipos de dados de exemplo

export function DataTableDemo() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">DataTable Demo</h1>
        <p className="text-muted-foreground">
          Demonstração do componente de tabela agnóstico com diferentes configurações
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4"></TabsContent>
      </Tabs>
    </div>
  );
}
