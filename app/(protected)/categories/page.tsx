'use client';

import type { TRPCClientErrorLike } from '@trpc/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import staticData from '../dashboard/data.json';

export default function CategoriesPage() {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  const { data: categories, isLoading, error } = trpc.categories.getAll.useQuery();
  const utils = trpc.useUtils();

  const createCategory = trpc.categories.create?.useMutation?.({
    onSuccess: () => {
      toast.success('Categoria criada com sucesso!');
      setName('');
      setColor('');
      utils.categories.getAll.invalidate();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createCategory?.mutate) {
      createCategory.mutate({ name, color: color || undefined });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criar Nova Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              name="name"
              placeholder="Nome da categoria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              name="color"
              placeholder="Cor (opcional)"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <Button type="submit" disabled={createCategory?.isPending}>
              {createCategory?.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : error ? (
            <div className="text-red-600">Erro: {error.message}</div>
          ) : (
            <ul className="space-y-2">
              {categories?.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <span
                      className="size-1.5 rounded-full"
                      style={c.color ? { backgroundColor: c.color } : { backgroundColor: '#000' }}
                      aria-hidden="true"
                    ></span>
                    {c.name}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>


    </>
  );
}
