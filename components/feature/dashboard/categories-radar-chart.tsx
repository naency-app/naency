'use client';

import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import React, { useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCentsBRL } from '@/helps/formatCurrency';
import { useDateFilter } from '@/hooks/use-date-filter';
import { trpc } from '@/lib/trpc';

export function CategoriesRadarChart() {
  const { dateRange } = useDateFilter();
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);

  const {
    data: categoriesData,
    isLoading,
    isError,
  } = trpc.expenses.getExpensesByCategories.useQuery({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  // Set default selection to first category when data loads
  React.useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && selectedParentCategories.length === 0) {
      setSelectedParentCategories([categoriesData[0].id]);
    }
  }, [categoriesData, selectedParentCategories.length]);

  // Handle parent category selection
  const handleParentCategoryChange = (value: string) => {
    setSelectedParentCategories([value]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Categories by Group</CardTitle>
          <CardDescription>Loading categories data...</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="h-[250px] w-full animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !categoriesData || categoriesData.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Categories by Group</CardTitle>
          <CardDescription>No categories data available</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
            {isError ? 'Error loading data' : 'No categories found'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoriesToShow =
    selectedParentCategories.length > 0
      ? categoriesData.filter((cat) => selectedParentCategories.includes(cat.id))
      : [];

  const chartData = categoriesToShow.flatMap((parentCategory) => {
    if (parentCategory.subcategories.length === 0) {
      return [
        {
          category: parentCategory.name,
          amount: parentCategory.total,
          color: 'var(--chart-1)',
          type: 'parent',
        },
      ];
    } else {
      return parentCategory.subcategories.map((subcategory) => ({
        category: subcategory.name,
        amount: subcategory.total || 0,
        color: 'var(--chart-1)',
        type: 'subcategory',
        parentName: parentCategory.name,
      }));
    }
  });

  const chartConfig: ChartConfig = {};
  chartData.forEach((item, index) => {
    const key = `category_${index}`;
    chartConfig[key] = {
      label: item.category,
      color: 'var(--chart-1)',
    };
  });

  const totalExpenses = chartData.reduce((sum, item) => sum + item.amount, 0);

  const averageExpenses = totalExpenses / chartData.length;

  const trend = totalExpenses > averageExpenses * chartData.length * 0.8 ? 'up' : 'down';

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Categories by group</CardTitle>
        <CardDescription>Expenses distribution across category groups</CardDescription>
        <CardAction >
          <Select
            value={selectedParentCategories[0] || ''}
            onValueChange={handleParentCategoryChange}
          >
            <SelectTrigger
              className="flex w-48 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              aria-label="Select parent category"
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {categoriesData.map((parentCategory) => (
                <SelectItem
                  key={parentCategory.id}
                  value={parentCategory.id}
                  className="rounded-lg"
                >
                  {parentCategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="pb-0">
        {/* Radar Chart */}
        <ChartContainer config={chartConfig} className="mx-auto  max-h-[290px]">
          <RadarChart data={chartData}>

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    console.log(value, name);
                    return (
                      <div>
                        <span>{formatCentsBRL(Number(value))}</span>
                      </div>
                    )
                  }}
                />
              }
            />
            <PolarAngleAxis
              dataKey="category"
            />

            <PolarGrid className="fill-(--color-destructive) opacity-5" />
            <Radar
              dataKey="amount"
              fill="var(--chart-1)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {trend === 'up' ? (
            <>
              Total expenses <span className="text-success">{formatCentsBRL(totalExpenses)}</span> this period{' '}
              <IconTrendingUp className="h-4 w-4 text-success" />
            </>
          ) : (
            <>
              Total expenses <span className="text-destructive">{formatCentsBRL(totalExpenses)}</span> this period{' '}
              <IconTrendingDown className="h-4 w-4 text-destructive" />
            </>
          )}
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          {categoriesToShow.length} category group • {chartData.length} subcategories
        </div>
      </CardFooter>
    </Card>
  );
}
