'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useSidebar } from '@/components/ui/sidebar';
import { trpc } from '@/lib/trpc';
import type { CategoryFromTRPC } from '@/types/trpc';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
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
  const { isMobile } = useSidebar();
  const [selectedColor, setSelectedColor] = useState('#000000');

  const { data: categoriesData } = trpc.categories.getAll.useQuery();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      color: '#000000',
      flow: defaultFlow,
      parentId: undefined,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color || '#000000',
        flow: category.flow,
        parentId: category.parentId || undefined,
      });
      setSelectedColor(category.color || '#000000');
    } else {
      form.reset({
        name: '',
        color: '#000000',
        flow: defaultFlow,
        parentId: undefined,
      });
      setSelectedColor('#000000');
    }
  }, [category, form, defaultFlow]);

  const handleSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  const parentCategories = categoriesData?.filter(
    cat => !cat.isArchived && cat.flow === form.watch('flow') && cat.id !== category?.id
  ) || [];

  const colorOptions = [
    '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
  ];

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
                  <SelectTrigger>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No parent</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      field.onChange(e.target.value);
                    }}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <div className="flex gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedColor(color);
                          field.onChange(color);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : category ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isMobile) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {category ? 'Update category details' : 'Add a new category to organize your transactions'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
