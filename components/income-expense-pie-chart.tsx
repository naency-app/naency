'use client';

import { format } from 'date-fns';
import { TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCentsBRL } from '@/helps/formatCurrency';
import { useDateStore } from '@/lib/date-store';
import { trpc } from '@/lib/trpc';

const chartConfig = {
  income: {
    label: 'Income',
    color: 'var(--chart-2)',
  },
  expense: {
    label: 'Expense',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function IncomeExpensePieChart() {
  const { dateRange } = useDateStore();

  const { data: incomesData } = trpc.incomes.getAll.useQuery({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  const { data: expensesData } = trpc.expenses.getAll.useQuery({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  const chartData = React.useMemo(() => {
    const totalIncome = incomesData?.reduce((acc, income) => acc + (income.amount || 0), 0) || 0;
    const totalExpense =
      expensesData?.reduce((acc, expense) => acc + (expense.amount || 0), 0) || 0;

    return [
      {
        type: 'income',
        amount: totalIncome,
        fill: 'var(--chart-2)',
        label: 'Income',
      },
      {
        type: 'expense',
        amount: totalExpense,
        fill: 'var(--chart-1)',
        label: 'Expense',
      },
    ].filter((item) => item.amount > 0);
  }, [incomesData, expensesData]);

  const totalAmount = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  const netAmount = React.useMemo(() => {
    const totalIncome = incomesData?.reduce((acc, income) => acc + (income.amount || 0), 0) || 0;
    const totalExpense =
      expensesData?.reduce((acc, expense) => acc + (expense.amount || 0), 0) || 0;
    return totalIncome - totalExpense;
  }, [incomesData, expensesData]);

  const formatDateRange = () => {
    if (!dateRange?.from) return 'All time';

    if (dateRange.from === dateRange.to) {
      return format(dateRange.from, 'dd/MM/yyyy');
    }

    return `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
  };

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col ">
        <CardHeader className="items-center pb-0">
          <CardTitle>Income vs Expense</CardTitle>
          <CardDescription>{formatDateRange()}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
          <p className="text-muted-foreground">No data available for selected date range</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col @container/card col-span-1">
      <CardHeader className="items-center pb-0">
        <CardTitle>Income vs Expense</CardTitle>
        <CardDescription>Expenses distribution across categories</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  formatter={(value, name, _item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        {formatCentsBRL(Number(value))}
                      </div>
                      {index === 1 && (
                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {formatCentsBRL(totalAmount)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                />
              }
            />
            <Pie data={chartData} cornerRadius={8}
              paddingAngle={4} dataKey="amount" nameKey="type" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-base font-bold"
                        >
                          {netAmount >= 0 ? '+' : ''}
                          {formatCentsBRL(netAmount)}
                        </tspan>

                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {netAmount >= 0 ? (
            <>
              Net positive by <span className="text-success">{formatCentsBRL(netAmount)}</span>{' '}
              <TrendingUp className="h-4 w-4 text-success" />
            </>
          ) : (
            <>
              Net negative by {formatCentsBRL(Math.abs(netAmount))}{' '}
              <TrendingDown className="h-4 w-4 text-destructive" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          {incomesData?.length || 0} income(s) • {expensesData?.length || 0} expense(s)
        </div>
      </CardFooter>
    </Card>
  );
}
