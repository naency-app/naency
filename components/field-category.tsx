import { type FieldValues, type Path, useFormContext } from 'react-hook-form';
import { trpc } from '@/lib/trpc';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { InputWithSearch, type SelectOption } from './ui/input-with-search';
import { Skeleton } from './ui/skeleton';

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function FieldCategory<T extends FieldValues>({
  name,
  label = 'Category',
  placeholder = 'Category',
  disabled,
}: Props<T>) {
  const { control, trigger } = useFormContext<T>();
  const { data: categories, isLoading } = trpc.categories.getAll.useQuery();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  // Transformar as categorias para o formato esperado pelo InputWithSearch
  const categoryOptions: SelectOption[] =
    categories?.map((category) => ({
      value: category.id,
      label: category.name,
      // Adicionar informações extras se necessário
      ...(category.color && { color: category.color }),
    })) || [];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className="flex-1">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <InputWithSearch
                  options={categoryOptions}
                  value={field.value || ''}
                  onValueChange={(value) => {
                    field.onChange(value || null);
                    trigger(name);
                  }}
                  placeholder={placeholder}
                  searchPlaceholder="Search categories..."
                  emptyMessage="No category found."
                  disabled={disabled}
                  className="flex-1"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
