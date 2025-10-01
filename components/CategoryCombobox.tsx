'use client';

import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { Fragment, useId, useMemo, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';

type Props = {
  flow: 'expense' | 'income';
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  value?: string | null;
  onValueChange?: (id: string | null) => void;
  allowParentSelect?: boolean;
  disabled?: boolean;
};

export default function CategoryCombobox({
  flow,
  label = 'Category',
  placeholder = 'Select category',
  searchPlaceholder = 'Search category...',
  emptyMessage = 'No category found.',
  value,
  onValueChange,
  allowParentSelect = false,
  disabled,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | null>(null);
  const selected = value ?? internalValue;

  const { data, isLoading } = trpc.categories.getHierarchical.useQuery({
    flow,
    includeArchived: true
  });

  type Node = { id: string; name: string; color?: string | null; subcategories?: Node[] };
  const groups = data as Node[] | undefined;

  const { selectedName, selectedColor } = useMemo(() => {
    if (!groups || !selected)
      return { selectedName: '', selectedColor: undefined as string | undefined };
    for (const g of groups) {
      if (allowParentSelect && g.id === selected)
        return { selectedName: g.name, selectedColor: g.color ?? undefined };
      const c = g.subcategories?.find((s) => s.id === selected);
      if (c) return { selectedName: c.name, selectedColor: c.color ?? undefined };
    }
    return { selectedName: '', selectedColor: undefined };
  }, [groups, selected, allowParentSelect]);

  const handleSelect = (id: string) => {
    onValueChange ? onValueChange(id) : setInternalValue(id);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="*:not-first:mt-2">
        <Label htmlFor={id}>{label}</Label>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
          >
            {selected && selectedName ? (
              <span className="flex min-w-0 items-center gap-2">
                {selectedColor ? (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                ) : null}
                <span className="truncate">{selectedName}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDownIcon size={16} className="text-muted-foreground/80 shrink-0" />
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
              {groups?.map((group) => (
                <Fragment key={group.id}>
                  <CommandGroup heading={`* ${group.name.toUpperCase()}`}>
                    {allowParentSelect && (
                      <CommandItem
                        value={`parent ${group.name}`}
                        onSelect={() => handleSelect(group.id)}
                      >
                        {group.name} (all)
                        {selected === group.id && <CheckIcon size={16} className="ml-auto" />}
                      </CommandItem>
                    )}
                    {group.subcategories?.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={`${group.name} ${c.name}`}
                        onSelect={() => handleSelect(c.id)}
                        className="pl-2"
                      >
                        {c.color && (
                          <span
                            className="mr-2 h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                        )}
                        <span className="truncate">{c.name}</span>
                        {selected === c.id && <CheckIcon size={16} className="ml-auto" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
