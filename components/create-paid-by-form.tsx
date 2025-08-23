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

interface CreatePaidByFormProps {
  onSuccess?: () => void;
}

export function CreatePaidByForm({ onSuccess }: CreatePaidByFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const { isMobile } = useSidebar();
  const paidByNameId = useId();

  const utils = trpc.useUtils();
  const createPaidBy = trpc.paidBy.create.useMutation({
    onSuccess: () => {
      toast.success('Paid By created successfully!');
      utils.paidBy.getAll.invalidate();
      setIsOpen(false);
      setName('');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Error creating paid by: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    await createPaidBy.mutateAsync({
      name: name.trim(),
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setName('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" variant="outline">
        <IconPlus className="size-4" />
        Add payment method
      </Button>

      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
        direction={isMobile ? 'bottom' : 'right'}
        dismissible={false}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create new paid by</DrawerTitle>
            <DrawerDescription>
              Add a new person or method for tracking who paid for expenses
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={paidByNameId}>Paid by name</Label>
                <Input
                  id={paidByNameId}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name (e.g., John, Credit Card, Cash)"
                  disabled={createPaidBy.isPending}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createPaidBy.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPaidBy.isPending || !name.trim()}
                  className="flex-1"
                  isLoading={createPaidBy.isPending}
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
