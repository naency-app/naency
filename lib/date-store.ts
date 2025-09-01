import { isAfter, isToday, subDays } from 'date-fns';
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

const adjustPersistedDates = (storedDateRange: DateRange | undefined): DateRange => {
  const today = new Date();

  if (!storedDateRange) {
    return {
      from: subDays(today, 30),
      to: today,
    };
  }

  if (!isToday(storedDateRange.to) && !isAfter(storedDateRange.to, today)) {
    return {
      from: storedDateRange.from,
      to: today,
    };
  }

  return storedDateRange;
};

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
      onRehydrateStorage: () => (state) => {
        if (state) {
          const adjustedDateRange = adjustPersistedDates(state.dateRange);
          state.dateRange = adjustedDateRange;
        }
      },
    }
  )
);
