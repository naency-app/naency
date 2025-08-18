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
  }, [utils.expenses.getAll, utils.expenses.getTotal]);

  return { dateRange };
}
