import React from 'react';
import type { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type Props = {
  control: Control<any>;
  name?: string; // default: "amount"
  label?: string; // default: "Amount *"
  disabled?: boolean;
};

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Formata a partir de dígitos => "R$ 1.234,56"
const formatFromDigits = (digits: string) => {
  // Evita números gigantes por acidente
  const trimmed = digits.replace(/\D+/g, '').slice(0, 12); // até trilhões em centavos
  const cents = trimmed === '' ? 0 : parseInt(trimmed, 10);
  return { cents, display: brlFmt.format(cents / 100) };
};

// Calcula o novo caret após formatar (heurística simples)
function computeNextCaret(prevValue: string, nextValue: string, prevCaret: number) {
  const prevDigitsBeforeCaret = prevValue.slice(0, prevCaret).replace(/\D+/g, '').length;
  let i = 0,
    digitsSeen = 0;
  while (i < nextValue.length && digitsSeen < prevDigitsBeforeCaret) {
    if (/\d/.test(nextValue[i])) digitsSeen++;
    i++;
  }
  return i;
}

export const AmountField = React.memo(function AmountField({
  control,
  name = 'amount',
  label = 'Amount *',
  disabled,
}: Props) {
  const [display, setDisplay] = React.useState(() => brlFmt.format(0));
  const raf = React.useRef<number | null>(null);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, formState, fieldState }) => (
        <FormItem className="flex-[2]">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              value={display}
              inputMode="numeric"
              disabled={disabled}
              onFocus={(e) => {
                // Se vier com valor inicial do RHF, sincroniza a exibição
                const cents = typeof field.value === 'number' ? field.value : 0;
                setDisplay(brlFmt.format((cents || 0) / 100));
                // coloca caret no fim
                queueMicrotask(() => {
                  const len = e.currentTarget.value.length;
                  e.currentTarget.setSelectionRange(len, len);
                });
              }}
              onChange={(e) => {
                const target = e.currentTarget;
                const prev = display;
                const prevCaret = target.selectionStart ?? prev.length;

                // Cancela RAF anterior e agenda um novo (suaviza digitação rápida)
                if (raf.current) cancelAnimationFrame(raf.current);
                raf.current = requestAnimationFrame(() => {
                  const raw = target.value;
                  const { cents, display: next } = formatFromDigits(raw);

                  // Atualiza o RHF sem validar agora (valida no blur)
                  field.onChange(cents);

                  // Atualiza visual
                  setDisplay(next);

                  // Reposiciona caret de modo estável
                  queueMicrotask(() => {
                    const caret = computeNextCaret(prev, next, prevCaret);
                    target.setSelectionRange(caret, caret);
                  });
                });
              }}
              onBlur={(e) => {
                // Força validação só aqui (barato e suficiente)
                field.onBlur();
                // Normaliza exibição com o valor final
                const cents = typeof field.value === 'number' ? field.value : 0;
                setDisplay(brlFmt.format((cents || 0) / 100));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});
