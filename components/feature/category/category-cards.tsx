'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCentsBRL } from '@/helps/formatCurrency';
import { trpc } from '@/lib/trpc';

export function CategoryCards() {
  const { data: categoriesData, isLoading: categoriesLoading } = trpc.categories.getAll.useQuery();
  const { data: expensesData, isLoading: expensesLoading } = trpc.expenses.getAll.useQuery({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  const { data: incomesData, isLoading: incomesLoading } = trpc.incomes.getAll.useQuery({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });

  const isLoading = categoriesLoading || expensesLoading || incomesLoading;

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`loading-card-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">-</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalCategories = categoriesData?.length || 0;
  const activeCategories = categoriesData?.filter((cat) => !cat.isArchived).length || 0;
  const archivedCategories = categoriesData?.filter((cat) => cat.isArchived).length || 0;

  const expenseCategories =
    categoriesData?.filter((cat) => cat.flow === 'expense' && !cat.isArchived).length || 0;
  const incomeCategories =
    categoriesData?.filter((cat) => cat.flow === 'income' && !cat.isArchived).length || 0;

  const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const totalIncomes = incomesData?.reduce((sum, income) => sum + income.amount, 0) || 0;

  return (
    <div className="px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              {activeCategories} active, {archivedCategories} archived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCategories}</div>
            <p className="text-xs text-muted-foreground">
              {expenseCategories} expense, {incomeCategories} income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCentsBRL(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Across {expenseCategories} categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Incomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCentsBRL(totalIncomes)}</div>
            <p className="text-xs text-muted-foreground">Across {incomeCategories} categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
