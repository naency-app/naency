'use client';
import { BankAccountCard } from '@/components/bank-account-card';
import { CategoriesRadarChart } from '@/components/feature/dashboard/categories-radar-chart';
import { DashboardCards } from '@/components/feature/dashboard/dashboard-cards';
import { IncomeExpensePieChart } from '@/components/income-expense-pie-chart';


export default function Page() {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 ">
          <div className="xl:col-span-3 space-y-4">
            <DashboardCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <IncomeExpensePieChart />
              <CategoriesRadarChart />
            </div>
          </div>
          <div className="xl:col-span-1">
            <BankAccountCard />
          </div>
        </div>
      </div>
    </div>
  );
}
