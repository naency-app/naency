import {
  IconChevronRight,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCentsBRL } from '@/helps/formatCurrency';
import { useDateFilter } from '@/hooks/use-date-filter';
import { trpc } from '@/lib/trpc';

export function DashboardCards() {
  const { dateRange } = useDateFilter();
  const router = useRouter();

  const {
    data: totalExpenses,
    isLoading: isLoadingExpenses,
    error: expensesError,
  } = trpc.expenses.getTotal.useQuery({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  const {
    data: totalIncomes,
    isLoading: isLoadingIncomes,
    error: incomesError,
  } = trpc.incomes.getTotal.useQuery({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  const balance = (totalIncomes || 0) - (totalExpenses || 0);
  const isLoadingBalance = isLoadingExpenses || isLoadingIncomes;

  const handleIncomesClick = () => {
    router.push('/incomes');
  };

  const handleExpensesClick = () => {
    router.push('/expenses');
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Incomes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoadingIncomes ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            ) : incomesError ? (
              <span className="text-destructive">Error</span>
            ) : (
              formatCentsBRL(totalIncomes || 0)
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-success border-success">
              <IconTrendingUp className="text-success" />
              Incomes
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter >
          <Button className="group text-xs " variant="outline" size="sm" onClick={handleIncomesClick}>
            View details <IconChevronRight className="size-4 group-hover:translate-x-1 transition-all" />
          </Button>
        </CardFooter>
      </Card>

      {/* Card de Total de Expenses */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoadingExpenses ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            ) : expensesError ? (
              <span className="text-destructive">Error</span>
            ) : (
              formatCentsBRL(totalExpenses || 0)
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-destructive border-destructive">
              <IconTrendingDown className="text-destructive" />
              Expenses
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter >
          <Button className="group text-xs " variant="outline" size="sm" onClick={handleExpensesClick}>
            View details <IconChevronRight className="size-4 group-hover:translate-x-1 transition-all" />
          </Button>
        </CardFooter>
      </Card>

      {/* Card de Saldo */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Balance</CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${balance >= 0 ? 'text-success' : 'text-destructive'
              }`}
          >
            {isLoadingBalance ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            ) : (
              formatCentsBRL(balance)
            )}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                balance >= 0 ? 'text-success border-success' : 'text-destructive border-destructive'
              }
            >
              <IconWallet className={balance >= 0 ? 'text-success' : 'text-destructive'} />
              {balance >= 0 ? 'Positive' : 'Negative'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className=" flex gap-2 items-center font-medium">
            Net balance <IconWallet className="size-4" />
          </div>
          <div className="text-muted-foreground">Incomes minus expenses for the period</div>
        </CardFooter>
      </Card>
    </div>
  );
}
