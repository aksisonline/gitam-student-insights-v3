import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PredictionData, DailyAttendanceRecord } from '@/lib/types';

interface TrendLineChartProps {
  historicalData: DailyAttendanceRecord[];
  predictionData: PredictionData;
  onTimeRangeChange?: (range: '7d' | '14d' | '30d') => void;
}

export function TrendLineChart({ historicalData, predictionData, onTimeRangeChange }: TrendLineChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');

  const handleTimeRangeChange = (value: string) => {
    const range = value as '7d' | '14d' | '30d';
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  const chartConfig = {
    historical: {
      label: "Historical Attendance",
      color: "hsl(142, 71%, 45%)",
    },
    predicted: {
      label: "Prediction (Most Likely)",
      color: "hsl(38, 92%, 50%)",
    },
    bestCase: {
      label: "Best Case (All Present)",
      color: "hsl(142, 71%, 45%)",
    },
    worstCase: {
      label: "Worst Case (All Absent)",
      color: "hsl(0, 84%, 60%)",
    },
  } satisfies ChartConfig;

  // Combine historical and prediction data
  const combinedLabels = [...historicalData.map(d => d.day), ...predictionData.labels];
  const combinedData = combinedLabels.map((label, index) => {
    if (index < historicalData.length) {
      return {
        label,
        historical: historicalData[index].attendance,
        predicted: null,
        bestCase: null,
        worstCase: null,
      };
    } else {
      const predIndex = index - historicalData.length;
      return {
        label,
        historical: null,
        predicted: predictionData.predicted[predIndex],
        bestCase: predictionData.bestCase[predIndex],
        worstCase: predictionData.worstCase[predIndex],
      };
    }
  });

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Attendance Trend
            </CardTitle>
            <CardDescription>Your attendance percentage over time with 5-day prediction</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <RechartsLineChart data={combinedData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            
            <Line
              dataKey="historical"
              stroke="var(--color-historical)"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              dataKey="predicted"
              stroke="var(--color-predicted)"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              dataKey="bestCase"
              stroke="var(--color-bestCase)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              connectNulls={false}
            />
            <Line
              dataKey="worstCase"
              stroke="var(--color-worstCase)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

