'use client';

import { CreateCategoryForm } from './create-category-form';
import { CreatePaidByForm } from './create-paid-by-form';

interface CreateFormsWrapperProps {
  onSuccess?: () => void;
}

export function CreateFormsWrapper({ onSuccess }: CreateFormsWrapperProps) {
  return (
    <div className="flex items-center gap-2">
      <CreateCategoryForm onSuccess={onSuccess} />
      <CreatePaidByForm onSuccess={onSuccess} />
    </div>
  );
}
