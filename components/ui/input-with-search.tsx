import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import * as React from 'react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Interface para os itens do select
export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  [key: string]: unknown; // Permite propriedades adicionais
}

// Props do componente
export interface InputWithSearchProps {
  options: SelectOption[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export function InputWithSearch({
  options,
  value: controlledValue,
  onValueChange,
  placeholder = 'Selecione uma opção',
  searchPlaceholder = 'Pesquisar...',
  emptyMessage = 'Nenhuma opção encontrada.',
  label,
  className,
  disabled = false,
  renderOption,
}: InputWithSearchProps) {
  const id = useId();
  const [open, setOpen] = React.useState<boolean>(false);
  const [internalValue, setInternalValue] = React.useState<string>('');

  // Usar valor controlado se fornecido, senão usar estado interno
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = (newValue: string | null) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue || '');
    }
    onValueChange?.(newValue);
  };

  const selectedOption = options.find((option) => option.value === value);

  // Renderização padrão do item
  const defaultRenderOption = (option: SelectOption) => (
    <div className="flex items-center gap-2">
      {option.color && (
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: option.color }}
        />
      )}
      {option.label}
    </div>
  );

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={cn('truncate', (!value || value === '') && 'text-muted-foreground')}>
              {value && value !== '' ? selectedOption?.label : placeholder}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      // Se clicar no mesmo item, deseleciona (define como null)
                      // Se clicar em um item diferente, seleciona o novo
                      const newValue = currentValue === value ? null : currentValue;
                      setValue(newValue);
                      setOpen(false);
                    }}
                  >
                    {renderOption ? renderOption(option) : defaultRenderOption(option)}
                    {value && value === option.value && <CheckIcon size={16} className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
