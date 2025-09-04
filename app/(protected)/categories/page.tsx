'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';
import { CreateCategoryForm } from '@/components/create-category-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { trpc } from '@/lib/trpc';

export default function CategoriesPage() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const {
    data: hierarchicalCategories,
    isLoading,
    error,
  } = trpc.categories.getHierarchical.useQuery();
  const utils = trpc.useUtils();

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryCreated = () => {
    utils.categories.getHierarchical.invalidate();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Carregando categorias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg">Erro ao carregar categorias: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col ">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Criar Nova Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateCategoryForm onSuccess={handleCategoryCreated} showFlowSelector />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estrutura de Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              {hierarchicalCategories && hierarchicalCategories.length > 0 ? (
                <div className="space-y-3">
                  {hierarchicalCategories.map((category) => (
                    <div key={category.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={
                              category.color
                                ? { backgroundColor: category.color }
                                : { backgroundColor: '#000' }
                            }
                            aria-hidden="true"
                          />
                          <span className="font-medium">{category.name}</span>
                          {category.subcategories && category.subcategories.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {category.subcategories.length} subcategoria
                              {category.subcategories.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        {category.subcategories && category.subcategories.length > 0 && (
                          <Collapsible
                            open={expandedCategories.has(category.id)}
                            onOpenChange={() => toggleExpanded(category.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {expandedCategories.has(category.id) ? (
                                  <IconChevronDown className="h-4 w-4" />
                                ) : (
                                  <IconChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                      </div>

                      {category.subcategories && category.subcategories.length > 0 && (
                        <Collapsible open={expandedCategories.has(category.id)}>
                          <CollapsibleContent className="mt-3 ml-6 space-y-2">
                            {category.subcategories.map((subcategory) => (
                              <div
                                key={subcategory.id}
                                className="flex items-center gap-2 pl-3 border-l-2 border-muted"
                              >
                                <span
                                  className="size-2 rounded-full"
                                  style={
                                    subcategory.color
                                      ? { backgroundColor: subcategory.color }
                                      : { backgroundColor: '#000' }
                                  }
                                  aria-hidden="true"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {subcategory.name}
                                </span>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg">Nenhuma categoria encontrada</div>
                  <div className="text-sm">
                    Crie sua primeira categoria para começar a organizar suas despesas
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
