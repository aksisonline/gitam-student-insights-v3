import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { BarChart3, Sparkles } from 'lucide-react';
import type { SubjectData } from '@/lib/types';

interface SubjectBarChartProps {
  subjects: SubjectData[];
}

export function SubjectBarChart({ subjects }: SubjectBarChartProps) {
  const chartConfig = {
    percentage: {
      label: "Attendance %",
    },
  } satisfies ChartConfig;

  const chartData = subjects.map((subject, index) => ({
    subject: subject.code,
    name: subject.name,
    percentage: subject.percentage,
    fill: subject.status === 'safe' 
      ? 'hsl(142, 71%, 45%)' 
      : subject.status === 'warning' 
      ? 'hsl(38, 92%, 50%)' 
      : 'hsl(0, 84%, 60%)'
  }));

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Subject-wise Performance
            </CardTitle>
            <CardDescription>Current attendance percentage for each subject</CardDescription>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <RechartsBarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis 
              dataKey="subject" 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="percentage" 
              radius={[8, 8, 0, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

