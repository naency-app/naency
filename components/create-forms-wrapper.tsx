'use client';

import { CreateCategoryForm } from './create-category-form';


interface CreateFormsWrapperProps {
  onSuccess?: () => void;
  context?: 'expense' | 'income';
}

export function CreateFormsWrapper({ onSuccess, context = 'expense' }: CreateFormsWrapperProps) {
  return (
    <div className="flex items-center gap-2">
      <CreateCategoryForm onSuccess={onSuccess} defaultFlow={context} />

    </div>
  );
}
