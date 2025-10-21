import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pie, PieChart as RechartsPieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { AttendanceStats } from '@/lib/types';

interface DistributionPieChartProps {
  stats: AttendanceStats;
}

export function DistributionPieChart({ stats }: DistributionPieChartProps) {
  const pieChartConfig = {
    subjects: {
      label: "Subjects",
    },
    safe: {
      label: "Safe (≥75%)",
      color: "hsl(142, 71%, 45%)",
    },
    warning: {
      label: "Warning (65-74%)",
      color: "hsl(38, 92%, 50%)",
    },
    risk: {
      label: "Risk (<65%)",
      color: "hsl(0, 84%, 60%)",
    },
  } satisfies ChartConfig;

  const pieData = [
    { name: 'safe', value: stats.safeSubjects, fill: 'var(--color-safe)' },
    { name: 'warning', value: stats.warningSubjects, fill: 'var(--color-warning)' },
    { name: 'risk', value: stats.riskSubjects, fill: 'var(--color-risk)' }
  ].filter(item => item.value > 0);

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Subject Distribution
            </CardTitle>
            <CardDescription>Breakdown by attendance status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={pieChartConfig} className="mx-auto aspect-square h-64">
          <RechartsPieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ payload, ...props }) => {
                return (
                  <text
                    cx={props.cx}
                    cy={props.cy}
                    x={props.x}
                    y={props.y}
                    textAnchor={props.textAnchor}
                    dominantBaseline={props.dominantBaseline}
                    fill="hsla(var(--foreground))"
                    className="text-xs font-medium"
                  >
                    {`${pieChartConfig[payload.name as keyof typeof pieChartConfig]?.label}: ${payload.value}`}
                  </text>
                )
              }}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

