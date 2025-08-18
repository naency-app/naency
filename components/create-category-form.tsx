'use client';

import { IconPlus, IconX } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSidebar } from '@/components/ui/sidebar';
import { trpc } from '@/lib/trpc';

interface CreateCategoryFormProps {
  onSuccess?: () => void;
}

export function CreateCategoryForm({ onSuccess }: CreateCategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const { isMobile } = useSidebar();
  const categoryNameId = useId();
  const categoryColorId = useId();

  const utils = trpc.useUtils();
  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Category created successfully!');
      utils.categories.getAll.invalidate();
      setIsOpen(false);
      setName('');
      setColor('#3b82f6');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Error creating category: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    await createCategory.mutateAsync({
      name: name.trim(),
      color,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setName('');
    setColor('#3b82f6');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" variant="outline">
        <IconPlus className="mr-2 h-4 w-4" />
        Add category
      </Button>

      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
        direction={isMobile ? 'bottom' : 'right'}
        dismissible={false}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create new category</DrawerTitle>
            <DrawerDescription>Add a new category to organize your expenses</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={categoryNameId}>Category name</Label>
                <Input
                  id={categoryNameId}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                  disabled={createCategory.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={categoryColorId}>Color</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor={categoryColorId}
                    className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center cursor-pointer transition-all"
                    style={{ backgroundColor: color }}
                  >
                    <input
                      id={categoryColorId}
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={createCategory.isPending}
                      className="opacity-0 w-8 h-8 cursor-pointer shrink-0"
                      tabIndex={-1}
                      style={{ position: 'absolute', pointerEvents: 'none' }}
                    />
                  </label>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    disabled={createCategory.isPending}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createCategory.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCategory.isPending || !name.trim()}
                  className="flex-1"
                  isLoading={createCategory.isPending}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
