import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { StatCardProps } from '@/lib/types';

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  subtitle,
  progress,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="relative overflow-hidden border hover:shadow-md transition-all duration-300 group hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 bg-${color}/10 rounded-lg group-hover:bg-${color}/20 transition-colors`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">
            {value}
          </div>
          {trend && getTrendIcon()}
        </div>
        
        {progress !== undefined && (
          <Progress value={progress} className="h-2" />
        )}
        
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

