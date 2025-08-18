import { addDays, subDays } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateStore {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetToDefault: () => void;
}

export const useDateStore = create<DateStore>()(
  persist(
    (set) => ({
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
      setDateRange: (range) => set({ dateRange: range }),
      resetToDefault: () =>
        set({
          dateRange: {
            from: subDays(new Date(), 30),
            to: new Date(),
          },
        }),
    }),
    {
      name: 'date-range-storage',
    }
  )
);
