'use client';

import { IconCornerDownRight, IconPlus } from '@tabler/icons-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';
import { trpc } from '@/lib/trpc';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface CreateCategoryFormProps {
  onSuccess?: () => void;
  defaultFlow?: 'expense' | 'income';
  showFlowSelector?: boolean;
}

type Level = 'group' | 'subcategory';

export function CreateCategoryForm({
  onSuccess,
  defaultFlow = 'expense',
  showFlowSelector = false,
}: CreateCategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flow, setFlow] = useState<'expense' | 'income'>(defaultFlow);
  const [level, setLevel] = useState<Level>('group');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [parentId, setParentId] = useState<string>('');
  const [createAnother, setCreateAnother] = useState(false);
  const { isMobile } = useSidebar();

  const categoryNameId = useId();
  const categoryColorId = useId();
  const categoryParentId = useId();
  const createAnotherId = useId();

  const utils = trpc.useUtils();

  const { data: allParents = [], isLoading: loadingParents } =
    trpc.categories.getParentCategories.useQuery();

  const parentOptions = useMemo(() => {
    return allParents.filter((c: { flow: 'expense' | 'income' }) => c.flow === flow);
  }, [allParents, flow]);

  // reset parent quando trocar para "group" ou mudar o flow
  useEffect(() => {
    if (level === 'group') setParentId('');
  }, [level]);
  useEffect(() => {
    // Clear parent selection whenever flow changes
    if (flow === 'expense' || flow === 'income') {
      setParentId('');
    }
  }, [flow]);

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Category created successfully!');
      utils.categories.getAll.invalidate();
      utils.categories.getParentCategories.invalidate();
      utils.categories.getHierarchical.invalidate();
      if (createAnother) {
        // Keep drawer open and reset fields for next creation
        setName('');
        setColor('#3b82f6');
        if (level === 'group') {
          setParentId('');
        }
      } else {
        handleClose();
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Error creating category: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Category name is required');
      return;
    }
    if (level === 'subcategory' && !parentId) {
      toast.error('Please select a parent group');
      return;
    }

    await createCategory.mutateAsync({
      name: trimmed,
      color,
      flow,
      parentId: level === 'group' ? undefined : parentId,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setFlow(defaultFlow);
    setLevel('group');
    setName('');
    setColor('#3b82f6');
    setParentId('');
  };

  const title = `Create ${flow === 'income' ? 'income' : 'expense'} ${level === 'group' ? 'group' : 'subcategory'}`;
  const description =
    level === 'group'
      ? `Add a new ${flow === 'income' ? 'income' : 'expense'} group to organize related categories`
      : `Add a new ${flow === 'income' ? 'income' : 'expense'} subcategory under an existing group`;

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" variant="outline">
        <IconPlus className="size-4" />
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
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Flow: Expense vs Income (only on categories page) */}
              {showFlowSelector && (
                <div className="space-y-2">
                  <Label>For</Label>
                  <Select
                    value={flow}
                    onValueChange={(v: 'expense' | 'income') => setFlow(v)}
                    disabled={createCategory.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose whether this category is for expenses or incomes.
                  </p>
                </div>
              )}

              {/* Level: Group vs Subcategory */}
              <div className="space-y-2">
                <Label>Category level</Label>
                <Tabs
                  defaultValue={level}
                  value={level}
                  onValueChange={(v) => setLevel((v as Level) || 'group')}
                  className="items-center w-full"
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="subcategory" className="flex-1">
                      Subcategory
                    </TabsTrigger>
                    <TabsTrigger value="group" className="flex-1">
                      Group
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {level === 'subcategory' && (
                <div className="space-y-2 ">
                  <Label htmlFor={categoryParentId}>Category group *</Label>
                  <Select
                    value={parentId || undefined}
                    onValueChange={(v) => setParentId(v || '')}
                    disabled={createCategory.isPending || loadingParents}
                  >
                    <SelectTrigger id={categoryParentId} className="w-full">
                      <SelectValue
                        placeholder={loadingParents ? 'Loading groups…' : 'Select group'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No groups found for this type.
                        </div>
                      ) : (
                        parentOptions.map((category: { id: string; name: string }) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The subcategory will be created under this group.
                  </p>
                </div>
              )}
              {/* Name (dinâmico) */}
              <div className="flex items-center gap-2">
                <IconCornerDownRight
                  className={`size-6 text-primary ${level === 'group' ? 'hidden' : ''}`}
                />
                <div className="space-y-2 w-full">
                  <Label htmlFor={categoryNameId}>
                    {level === 'group' ? 'Category name *' : 'Subcategory name *'}
                  </Label>
                  <Input
                    id={categoryNameId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={level === 'group' ? 'e.g., Habitação' : 'e.g., Aluguel'}
                    disabled={createCategory.isPending}
                  />
                </div>
              </div>
              {level === 'subcategory' && (
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
              )}


              <div className="flex items-center gap-2">
                <Checkbox
                  id={createAnotherId}
                  checked={createAnother}
                  onCheckedChange={(v) => setCreateAnother(!!v)}
                  disabled={createCategory.isPending}
                />
                <Label htmlFor={createAnotherId} className="text-sm text-muted-foreground">
                  Keep open
                </Label>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-2">
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
                  disabled={
                    createCategory.isPending ||
                    !name.trim() ||
                    (level === 'subcategory' && !parentId)
                  }
                  className="flex-1"
                  isLoading={createCategory.isPending}
                >
                  {level === 'group' ? 'Create group' : 'Create subcategory'}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
