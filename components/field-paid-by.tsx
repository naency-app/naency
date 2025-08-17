import { trpc } from "@/lib/trpc";
import {
  SelectTrigger, SelectValue, SelectContent, SelectItem, Select,
  SelectLabel, SelectGroup,
} from "./ui/select";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "./ui/form";
import { Skeleton } from "./ui/skeleton";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Button } from "./ui/button";

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

export function FieldPaidBy<T extends FieldValues>({
  name,
  label = "Paid By",
  placeholder = "Paid By",
  disabled,
  allowClear = false,
  clearLabel = "Limpar",
}: Props<T>) {
  const { control, setValue, getValues, trigger } = useFormContext<T>();
  const { data: paidBy, isLoading } = trpc.paidBy.getAll.useQuery();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const hasValue = typeof field.value === "string" && field.value.length > 0;

        return (
          <FormItem className="flex-1">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Select
                  value={typeof field.value === "string" ? field.value : ""}
                  onValueChange={(v) => {
                    const next = v === undefined ? (undefined as unknown as T[typeof name]) : (v as unknown as T[typeof name]);
                    field.onChange(next);
                    trigger(name as any);
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>

                      {allowClear && (
                        <SelectItem value={undefined as unknown as T[typeof name]} >
                          — none —
                        </SelectItem>
                      )}

                      {paidBy?.map((paidBy) => (
                        <SelectItem key={paidBy.id} value={paidBy.id}>
                          <div className="flex items-center gap-2">
                            {paidBy.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>


              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
