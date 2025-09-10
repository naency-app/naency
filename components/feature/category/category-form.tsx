'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import type { CategoryFromTRPC } from '@/types/trpc';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  flow: z.enum(['expense', 'income']),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: CategoryFromTRPC;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  defaultFlow?: 'expense' | 'income';
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
  open,
  onOpenChange,
  direction = 'right',
  defaultFlow = 'expense',
}: CategoryFormProps) {

  const { data: categoriesData } = trpc.categories.getAll.useQuery();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      flow: defaultFlow,
      parentId: undefined,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        flow: category.flow,
        parentId: category.parentId || undefined,
      });
    } else {
      form.reset({
        name: '',
        flow: defaultFlow,
        parentId: undefined,
      });
    }
  }, [category, form, defaultFlow]);

  const handleSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  // Function to check if a category can be a parent (avoiding cycles)
  const canBeParent = (potentialParentId: string, currentCategoryId?: string): boolean => {
    if (!currentCategoryId || potentialParentId === currentCategoryId) return false;

    // Check if current category is a descendant of potential parent
    const isDescendant = (parentId: string, childId: string): boolean => {
      const child = categoriesData?.find(cat => cat.id === childId);
      if (!child || !child.parentId) return false;
      if (child.parentId === parentId) return true;
      return isDescendant(parentId, child.parentId);
    };

    return !isDescendant(potentialParentId, currentCategoryId);
  };

  // Filter parent categories based on current flow and exclude current category and its descendants
  const parentCategories = categoriesData?.filter(
    cat => !cat.isArchived &&
      cat.flow === form.watch('flow') &&
      cat.id !== category?.id &&
      cat.parentId === null && // Only show root categories as potential parents
      canBeParent(cat.id, category?.id)
  ) || [];


  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="flow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flow</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select flow" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Category (Optional)</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No parent (Root category)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {category?.parentId && (
                <p className="text-sm text-muted-foreground">
                  This is a subcategory. Changing the parent will move it to a different hierarchy.
                </p>
              )}
            </FormItem>
          )}
        />


        <div className="flex justify-end gap-2">
          <Button type="button" className='flex-1' variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" className='flex-1' disabled={isLoading}>
            {isLoading ? 'Saving...' : category ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {category ? 'Edit Category' : 'Create Category'}
          </DrawerTitle>
          <DrawerDescription>
            {category ? 'Update category details' : 'Add a new category to organize your transactions'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          {formContent}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
