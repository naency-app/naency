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

export function FieldTransactionAccount<T extends FieldValues>({
  name,
  label = 'Transaction account',
  placeholder = 'Transaction account',
  disabled,
}: Props<T>) {
  const { control, trigger } = useFormContext<T>();
  const { data: transactionAccounts, isLoading } = trpc.transactionAccount.getAll.useQuery();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  const transactionAccountOptions: SelectOption[] =
    transactionAccounts?.map((account) => ({
      value: account.id,
      label: account.name,
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
                  options={transactionAccountOptions}
                  value={field.value || ''}
                  onValueChange={(value) => {
                    field.onChange(value || null);
                    trigger(name);
                  }}
                  placeholder={placeholder}
                  searchPlaceholder="Search transaction accounts..."
                  emptyMessage="No transaction account found."
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
