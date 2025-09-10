'use client';

import { IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateFormsWrapper } from '@/components/create-forms-wrapper';
import { CategoryCards } from '@/components/feature/category/category-cards';
import { CategoryForm } from '@/components/feature/category/category-form';
import { SimpleCategoryTree } from '@/components/feature/category/simple-category-tree';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import type { CategoryFromTRPC } from '@/types/trpc';

export default function CategoriesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFromTRPC | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryFromTRPC | null>(null);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const { isMobile } = useSidebar();

  const { data: categoriesData, isLoading: categoriesLoading } = trpc.categories.getAll.useQuery();
  const utils = trpc.useUtils();

  const expandAll = () => {
    // This function is kept for consistency with the UI, but the SimpleCategoryTree handles its own state
    console.log('Expand all clicked');
  };

  const collapseAll = () => {
    // This function is kept for consistency with the UI, but the SimpleCategoryTree handles its own state
    console.log('Collapse all clicked');
  };

  // Filter categories by flow type
  const expenseCategories = categoriesData?.filter((cat) => cat.flow === 'expense') || [];
  const incomeCategories = categoriesData?.filter((cat) => cat.flow === 'income') || [];

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Category created successfully!');
      utils.categories.getAll.invalidate();
      setIsDrawerOpen(false);
      setEditingCategory(null);
    },
    onError: (error) => toast.error(`Error creating category: ${error.message}`),
  });

  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success('Category updated successfully!');
      utils.categories.getAll.invalidate();
      setIsDrawerOpen(false);
      setEditingCategory(null);
    },
    onError: (error) => toast.error(`Error updating category: ${error.message}`),
  });

  const deleteCategory = trpc.categories.archive.useMutation({
    onSuccess: () => {
      toast.success('Category deleted successfully!');
      utils.categories.getAll.invalidate();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => toast.error(`Error deleting category: ${error.message}`),
  });

  const getParentCategoryName = (parentId: string | null | undefined) => {
    if (!parentId || !categoriesData) return null;
    const parent = categoriesData.find((cat) => cat.id === parentId);
    return parent?.name || null;
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsDrawerOpen(true);
  };

  const handleCreateSubcategory = (parentCategory: CategoryFromTRPC) => {
    setEditingCategory({ ...parentCategory, parentId: parentCategory.id } as CategoryFromTRPC);
    setIsDrawerOpen(true);
  };

  const handleEditCategory = (category: CategoryFromTRPC) => {
    setEditingCategory(category);
    setIsDrawerOpen(true);
  };

  const handleViewCategory = (category: CategoryFromTRPC) => {
    setEditingCategory(category);
    setIsDrawerOpen(true);
  };

  const handleDeleteCategory = (category: CategoryFromTRPC) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete)
      await deleteCategory.mutateAsync({ id: categoryToDelete.id, cascade: true });
  };

  const handleFormSubmit = async (data: {
    name: string;
    color?: string;
    flow: 'expense' | 'income';
    parentId?: string;
  }) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: data.name,
        color: data.color,
        flow: data.flow,
        parentId: data.parentId || null,
      });
    } else {
      await createCategory.mutateAsync({
        name: data.name,
        color: data.color,
        flow: data.flow,
        parentId: data.parentId,
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <CategoryCards />
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Category management</CardTitle>
                      <CardDescription>Here you can manage your categories</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreateFormsWrapper
                        context="category"
                        onSuccess={() => {
                          utils.categories.getAll.invalidate();
                        }}
                      />
                      <Button size="sm" onClick={handleCreateCategory}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add category
                      </Button>
                      <Button size="sm" variant="outline" onClick={expandAll}>
                        <IconChevronDown className="mr-2 h-4 w-4" />
                        Expand all
                      </Button>
                      <Button size="sm" variant="outline" onClick={collapseAll}>
                        <IconChevronRight className="mr-2 h-4 w-4" />
                        Collapse all
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="text-center py-8">
                      <div className="text-lg">Loading categories...</div>
                    </div>
                  ) : (
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => setActiveTab(value as 'expense' | 'income')}
                    >
                      <TabsList className="">
                        <TabsTrigger value="expense">Expense</TabsTrigger>
                        <TabsTrigger value="income">Income</TabsTrigger>
                      </TabsList>

                      <TabsContent value="expense" className="mt-4">
                        {expenseCategories.length > 0 ? (
                          <SimpleCategoryTree
                            data={expenseCategories}
                            onView={handleViewCategory}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                            onCreateSubcategory={handleCreateSubcategory}
                            getParentCategoryName={getParentCategoryName}
                          />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="text-lg">No expense categories found</div>
                            <div className="text-sm">
                              Create your first expense category to start organizing your expenses
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="income" className="mt-4">
                        {incomeCategories.length > 0 ? (
                          <SimpleCategoryTree
                            data={incomeCategories}
                            onView={handleViewCategory}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                            onCreateSubcategory={handleCreateSubcategory}
                            getParentCategoryName={getParentCategoryName}
                          />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="text-lg">No income categories found</div>
                            <div className="text-sm">
                              Create your first income category to start organizing your incomes
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {categoriesData && (
        <CategoryForm
          category={editingCategory || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleDrawerClose}
          isLoading={createCategory.isPending || updateCategory.isPending}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          direction={isMobile ? 'bottom' : 'right'}
          defaultFlow={activeTab}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;?
              This action cannot be undone and will also delete all subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
