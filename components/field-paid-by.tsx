import { trpc } from "@/lib/trpc";
import { InputWithSearch, type SelectOption } from "./ui/input-with-search";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "./ui/form";
import { Skeleton } from "./ui/skeleton";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

export function FieldPaidBy<T extends FieldValues>({
  name,
  label = "Paid By",
  placeholder = "Paid By",
  disabled,
}: Props<T>) {
  const { control, trigger } = useFormContext<T>();
  const { data: paidBy, isLoading } = trpc.paidBy.getAll.useQuery();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  const paidByOptions: SelectOption[] = [
    ...(paidBy?.map((user) => ({
      value: user.id,
      label: user.name,
    })) || [])
  ];

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
                  options={paidByOptions}
                  value={typeof field.value === "string" ? field.value : ""}
                  onValueChange={(value) => {
                    // Se value for undefined ou string vazia, define como null para o RHF
                    const next = (value === "" || value === undefined) ? (null as unknown as T[typeof name]) : (value as unknown as T[typeof name]);
                    field.onChange(next);
                    trigger(name);
                  }}
                  placeholder={placeholder}
                  searchPlaceholder="Search users..."
                  emptyMessage="No user found."
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
