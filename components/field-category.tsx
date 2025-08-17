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

export function FieldCategory<T extends FieldValues>({
  name,
  label = "Category",
  placeholder = "Category",
  disabled,
  allowClear = false,
  clearLabel = "Limpar",
}: Props<T>) {
  const { control, setValue, getValues, trigger } = useFormContext<T>();
  const { data: categories, isLoading } = trpc.categories.getAll.useQuery();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const hasValue = field.value && typeof field.value === "string" && field.value.length > 0;

        return (
          <FormItem className="flex-1">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Select
                  // quando não houver seleção, passe "" (controlado) para o Select
                  value={field.value || ""}
                  onValueChange={(v) => {
                    // Define o valor selecionado
                    field.onChange(v);
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

                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.color && (
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {allowClear && hasValue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // zera via RHF, marcando dirty/validate
                      setValue(name, "" as unknown as T[typeof name], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      // garante que o Select reflita imediatamente
                      trigger(name as any);
                    }}
                  >
                    {clearLabel}
                  </Button>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
