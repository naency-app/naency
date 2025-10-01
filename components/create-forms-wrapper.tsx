'use client';

import { CreateCategoryForm } from './create-category-form';


interface CreateFormsWrapperProps {
  onSuccess?: () => void;
  context?: 'expense' | 'income' | 'category';
}

export function CreateFormsWrapper({ onSuccess, context = 'expense' }: CreateFormsWrapperProps) {
  if (context === 'category') {
    return (
      <div className="flex items-center gap-2">
        <CreateCategoryForm
          onSuccess={onSuccess}
          defaultFlow="expense"
          showFlowSelector={true}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CreateCategoryForm
        onSuccess={onSuccess}
        defaultFlow={context}
        showFlowSelector={false}
      />
    </div>
  );
}
