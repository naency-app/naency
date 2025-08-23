'use client';

import * as React from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';

/* =========================
   Tipos de entrada
   ========================= */
export type Income = {
  id: string;
  userId: string;
  description: string;
  amount: number; // centavos
  receivedAt: string; // ISO
  receivingAccountId?: string | null;
  categoryId?: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  userId: string;
  name: string;
  amount: number; // centavos
  paidAt: string; // ISO
  paidById?: string | null;
  categoryId?: string | null;
  transactionAccountId?: string | null;
  createdAt: string;
};

type Range = '90d' | '30d' | '7d';

type Props = {
  incomes: Income[];
  expenses: Expense[];
  title?: string;
  /** today = janela sempre termina em hoje; lastData = termina no último dia com dado */
  anchor?: 'today' | 'lastData';
};

/* =========================
   Config do ChartContainer
   ========================= */
const chartConfig = {
  income: { label: 'Income', color: 'var(--chart-2)' },
  expense: { label: 'Expense', color: 'var(--chart-1)' },
  net: { label: 'Net', color: 'var(--primary)' },
} satisfies ChartConfig;

/* =========================
   Helpers
   ========================= */


const fmtBRLAxis = (cents: number) => {
  const abs = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(cents) / 100);
  return cents < 0 ? `-${abs}` : abs;
};

const toYmdUTC = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDaysUTC = (d: Date, n: number) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};

function indexByDay(incomes: Income[], expenses: Expense[]) {
  const inc = new Map<string, number>();
  for (const i of incomes) {
    const key = toYmdUTC(new Date(i.receivedAt));
    inc.set(key, (inc.get(key) ?? 0) + i.amount);
  }
  const exp = new Map<string, number>();
  for (const e of expenses) {
    const key = toYmdUTC(new Date(e.paidAt));
    exp.set(key, (exp.get(key) ?? 0) + e.amount);
  }
  return { inc, exp };
}

/** Gera série diária preenchendo zeros no range [start,end] (inclusive). */
function fillWindowWithZeros(
  start: Date,
  end: Date,
  idx: { inc: Map<string, number>; exp: Map<string, number> }
) {
  const out: { date: string; income: number; expense: number; net: number }[] = [];
  for (let cur = start; cur <= end; cur = addDaysUTC(cur, 1)) {
    const key = toYmdUTC(cur);
    const income = idx.inc.get(key) ?? 0;
    const expensePos = idx.exp.get(key) ?? 0;
    out.push({
      date: key,
      income,
      expense: -expensePos, // negativo para desenhar para baixo
      net: income - expensePos,
    });
  }
  return out;
}

/* =========================
   Componente
   ========================= */
export function CashflowBars({
  incomes,
  expenses,
  title = 'Cash Flow (Daily)',
  anchor = 'today',
}: Props) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState<Range>('90d');

  React.useEffect(() => {
    if (isMobile) setTimeRange('7d');
  }, [isMobile]);

  const idx = React.useMemo(() => indexByDay(incomes, expenses), [incomes, expenses]);

  // limites para descrição + âncora
  const allDates: Date[] = React.useMemo(() => {
    const ds: Date[] = [];
    incomes.forEach((i) => {
      const d = new Date(i.receivedAt);
      if (!isNaN(d.getTime())) {
        ds.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      }
    });
    expenses.forEach((e) => {
      const d = new Date(e.paidAt);
      if (!isNaN(d.getTime())) {
        ds.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      }
    });
    return ds.sort((a, b) => a.getTime() - b.getTime());
  }, [incomes, expenses]);

  const minDataDate = allDates[0] ?? null;
  const lastDataDate = allDates[allDates.length - 1] ?? null;

  // fim da janela
  const referenceDate = React.useMemo(() => {
    if (anchor === 'today') {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    return lastDataDate
      ? lastDataDate
      : (() => {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      })();
  }, [anchor, lastDataDate]);

  // início da janela (inclui o dia de referência; ex.: 7d => 7 dias incluindo hoje)
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = React.useMemo(
    () => addDaysUTC(referenceDate, -(days - 1)),
    [referenceDate, days]
  );

  const data = React.useMemo(
    () => fillWindowWithZeros(startDate, referenceDate, idx),
    [startDate, referenceDate, idx]
  );

  const desc = React.useMemo(() => {
    if (!minDataDate || !lastDataDate) return 'No data';
    return `From ${minDataDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} to ${lastDataDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  }, [minDataDate, lastDataDate]);

  return (
    <Card className="@container/card col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{desc}</span>
          <span className="@[540px]/card:hidden">
            {timeRange === '90d'
              ? 'Last 3 months'
              : timeRange === '30d'
                ? 'Last 30 days'
                : 'Last 7 days'}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => setTimeRange((v as Range) || '90d')}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={(v) => setTimeRange((v as Range) || '90d')}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <ComposedChart data={data}>
            <CartesianGrid vertical={false} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              tickFormatter={(v) => fmtBRLAxis(Number(v))}
              width={56}
              axisLine={false}
              tickLine={false}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) =>
                new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(v) =>
                    new Date(`${v}T00:00:00.000Z`).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })
                  }
                // valueFormatter={(v, name) =>
                //   `${name === 'expense' ? '-' : ''}${fmtBRL(Math.abs(Number(v)))}`
                // }
                />
              }
            />
            {/* Barras: income para cima; expense para baixo */}
            <Bar
              dataKey="income"
              name="income"
              fill="var(--color-income)"
              barSize={8}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="var(--color-expense)"
              barSize={8}
              radius={[0, 0, 4, 4]}
            />
            {/* Linha do líquido (income - expensePositiva) */}
            <Line
              type="monotone"
              dataKey="net"
              name="net"
              stroke="var(--color-net)"
              dot={false}
              strokeWidth={2}
            />

          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
