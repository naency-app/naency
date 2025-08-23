'use client';
import { CashflowBars } from '@/components/chart-area-interactive';
import { CategoriesRadarChart } from '@/components/feature/dashboard/categories-radar-chart';
import { DashboardCards } from '@/components/feature/dashboard/dashboard-cards';
import { IncomeExpensePieChart } from '@/components/income-expense-pie-chart';

import { trpc } from '@/lib/trpc';

export default function Page() {
  const { data: incomesData } = trpc.incomes.getAll.useQuery();
  const { data: expensesData } = trpc.expenses.getAll.useQuery();
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DashboardCards />

          {/* Income vs Expense Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-6">
            <IncomeExpensePieChart />

            <CashflowBars
              incomes={incomesData || []}
              expenses={
                expensesData?.map((expense) => ({
                  ...expense,
                  paidAt: expense.paidAt || '',
                })) || []
              }
              anchor="today"
            />

            <CategoriesRadarChart />
          </div>

          {/* Componentes de teste da API */}
          <div className="px-4 lg:px-6"></div>
        </div>
      </div>
    </div>
  );
}
