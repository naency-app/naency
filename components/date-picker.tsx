'use client';

import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDateStore } from '@/lib/date-store';
import { cn } from '@/lib/utils';

export default function DatePicker() {
  const { dateRange, setDateRange } = useDateStore();
  const today = new Date();
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  };
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  };
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  };
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  // Generate months for dropdown (current month to 12 months ago)
  const generateMonthOptions = () => {
    const months = [];
    for (let i = 0; i <= 12; i++) {
      const date = subMonths(today, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      months.push({
        label: format(date, 'MMMM yyyy'),
        value: { from: monthStart, to: monthEnd },
        date: date,
      });
    }
    return months;
  };

  const monthOptions = generateMonthOptions();
  const [month, setMonth] = useState(today);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
    }
  };

  const handlePresetSelect = (preset: DateRange) => {
    if (preset.from && preset.to) {
      setDateRange({
        from: preset.from,
        to: preset.to,
      });
      setMonth(preset.to);
      setIsOpen(false);
    }
  };

  const isPresetActive = (preset: DateRange) => {
    if (!dateRange?.from || !dateRange?.to || !preset.from || !preset.to) return false;

    // Ensure dates are Date objects
    const fromDate = dateRange.from instanceof Date ? dateRange.from : new Date(dateRange.from);
    const toDate = dateRange.to instanceof Date ? dateRange.to : new Date(dateRange.to);

    const currentFromTime = fromDate.getTime();
    const currentToTime = toDate.getTime();

    // Check exact matches first
    if (currentFromTime === preset.from.getTime() && currentToTime === preset.to.getTime()) {
      return true;
    }

    // Check if it's "Last 7 days" (6 days difference)
    if (preset === last7Days) {
      const daysDiff = Math.ceil((currentToTime - currentFromTime) / (1000 * 60 * 60 * 24));
      return daysDiff === 6;
    }

    // Check if it's "Last 30 days" (29 days difference)
    if (preset === last30Days) {
      const daysDiff = Math.ceil((currentToTime - currentFromTime) / (1000 * 60 * 60 * 24));
      return daysDiff === 29;
    }

    // Check if it's "Today" (same day)
    if (preset.from.getTime() === today.getTime() && preset.to.getTime() === today.getTime()) {
      return currentFromTime === currentToTime &&
        currentFromTime >= startOfDay(today).getTime() &&
        currentFromTime <= endOfDay(today).getTime();
    }

    // Check if it's "Yesterday" (same day, previous day)
    if (preset === yesterday) {
      if (currentFromTime === currentToTime) {
        const yesterdayStart = startOfDay(yesterday.from).getTime();
        const yesterdayEnd = endOfDay(yesterday.from).getTime();
        return currentFromTime >= yesterdayStart && currentFromTime <= yesterdayEnd;
      }
      return false;
    }

    // Check if it's "Month to date"
    if (preset === monthToDate) {
      return currentFromTime === startOfMonth(today).getTime() &&
        currentToTime === today.getTime();
    }

    // Check if it's "Last month"
    if (preset === lastMonth) {
      return currentFromTime === startOfMonth(subMonths(today, 1)).getTime() &&
        currentToTime === endOfMonth(subMonths(today, 1)).getTime();
    }

    // Check if it's a month selection from dropdown
    const monthOptions = generateMonthOptions();
    const isMonthOption = monthOptions.some(
      (option) =>
        option.value.from.getTime() === preset.from?.getTime() &&
        option.value.to.getTime() === preset.to?.getTime()
    );
    if (isMonthOption) {
      return true;
    }

    return false;
  };

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
          >
            <span className={cn('truncate', !dateRange?.from && 'text-muted-foreground')}>
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy')
                )
              ) : (
                'Pick a date range'
              )}
            </span>
            <CalendarIcon
              size={16}
              className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="rounded-md border-0">
            <div className="flex max-sm:flex-col">
              <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
                <div className="h-full sm:border-e">
                  <div className="flex flex-col px-2">
                    <Button
                      variant={isPresetActive({ from: today, to: today }) ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isPresetActive({ from: today, to: today }) &&
                        'bg-primary text-primary-foreground'
                      )}
                      onClick={() =>
                        handlePresetSelect({
                          from: today,
                          to: today,
                        })
                      }
                    >
                      Today
                    </Button>
                    <Button
                      variant={isPresetActive(yesterday) ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isPresetActive(yesterday) && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handlePresetSelect(yesterday)}
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant={isPresetActive(last7Days) ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isPresetActive(last7Days) && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handlePresetSelect(last7Days)}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant={isPresetActive(last30Days) ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isPresetActive(last30Days) && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handlePresetSelect(last30Days)}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant={isPresetActive(monthToDate) ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isPresetActive(monthToDate) && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handlePresetSelect(monthToDate)}
                    >
                      Month to date
                    </Button>
                    <Button
                      variant={isPresetActive(lastMonth) ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isPresetActive(lastMonth) && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handlePresetSelect(lastMonth)}
                    >
                      Last month
                    </Button>
                    <div className="px-2 py-1">
                      <Select
                        value={(() => {
                          // Find the month option that matches the current calendar month
                          const currentMonthOption = monthOptions.find((option) => {
                            const optionMonth = option.date.getMonth();
                            const optionYear = option.date.getFullYear();
                            const currentMonth = month.getMonth();
                            const currentYear = month.getFullYear();
                            return optionMonth === currentMonth && optionYear === currentYear;
                          });
                          return currentMonthOption ? currentMonthOption.date.getTime().toString() : '';
                        })()}
                        onValueChange={(value: string) => {
                          const selectedMonth = monthOptions.find(
                            (option) => option.date.getTime().toString() === value
                          );
                          if (selectedMonth) {
                            handlePresetSelect(selectedMonth.value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map((option) => (
                            <SelectItem
                              key={`${option.date.getTime()}`}
                              value={option.date.getTime().toString()}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <Calendar
                mode="range"
                numberOfMonths={2}
                pagedNavigation
                selected={dateRange}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                className="p-2"
                disabled={[
                  { after: today }, // Dates before today
                ]}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
