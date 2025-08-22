'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCentsBRL, formatCurrency } from '@/helps/formatCurrency';
import { formatDateRange } from '@/helps/formatDate';
import { useDateFilter } from '@/hooks/use-date-filter';
import { trpc } from '@/lib/trpc';

export function IncomeCards() {
  const { dateRange } = useDateFilter();

  const {
    data: totalIncome,
    isLoading: isLoadingIncome,
    isError: isErrorIncome,
  } = trpc.incomes.getTotal.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });
  const periodText = formatDateRange(dateRange.from, dateRange.to);
  return (
    <div className="*:data-[slot=card]:from-success/10 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card col-span-1.5">
        <CardHeader>
          <CardDescription>
            Total amount of <span className="font-bold text-green-500">{periodText}</span>
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoadingIncome ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            ) : isErrorIncome ? (
              <span className="text-destructive">---</span>
            ) : (
              formatCentsBRL(totalIncome || 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total income for selected period <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Filtered by date range</div>
        </CardFooter>
      </Card>
    </div>
  );
}
