import { useEffect } from 'react';
import { useDateStore } from '@/lib/date-store';
import { trpc } from '@/lib/trpc';

export function useDateFilter() {
  const { dateRange } = useDateStore();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Invalida as queries relacionadas a expenses quando as datas mudarem
    utils.expenses.getAll.invalidate();
    utils.expenses.getTotal.invalidate();
    // Invalida as queries relacionadas a incomes quando as datas mudarem
    utils.incomes.getAll.invalidate();
    utils.incomes.getTotal.invalidate();
  }, [
    utils.expenses.getAll,
    utils.expenses.getTotal,
    utils.incomes.getAll,
    utils.incomes.getTotal,
  ]);

  return { dateRange };
}
