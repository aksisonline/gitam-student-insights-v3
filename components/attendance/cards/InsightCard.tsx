import { Card, CardContent } from '@/components/ui/card';
import type { InsightCardProps } from '@/lib/types';

export function InsightCard({ type, message, icon: Icon, count }: InsightCardProps) {
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
          border: 'border-red-200 dark:border-red-900',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-600 dark:text-red-400',
          textColor: 'text-red-900 dark:text-red-100',
          subtextColor: 'text-red-800 dark:text-red-200',
          glowColor: 'bg-red-500/10',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20',
          border: 'border-amber-200 dark:border-amber-900',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-600 dark:text-amber-400',
          textColor: 'text-amber-900 dark:text-amber-100',
          subtextColor: 'text-amber-800 dark:text-amber-200',
          glowColor: 'bg-amber-500/10',
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20',
          border: 'border-green-200 dark:border-green-900',
          iconBg: 'bg-green-500/20',
          iconColor: 'text-green-600 dark:text-green-400',
          textColor: 'text-green-900 dark:text-green-100',
          subtextColor: 'text-green-800 dark:text-green-200',
          glowColor: 'bg-green-500/10',
        };
    }
  };

  const colors = getColors();

  return (
    <Card className={`relative overflow-hidden border-2 ${colors.bg} ${colors.border}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.glowColor} rounded-full blur-3xl`}></div>
      <CardContent className="relative p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${colors.iconBg} rounded-lg`}>
              <Icon className={`h-5 w-5 ${colors.iconColor}`} />
            </div>
            <h4 className={`font-bold ${colors.textColor} text-base`}>
              {type === 'danger' && 'Critical Attention Required'}
              {type === 'warning' && 'Warning Zone'}
              {type === 'success' && 'Excellent Progress!'}
            </h4>
          </div>
          <p className={`text-sm ${colors.subtextColor} leading-relaxed`}>
            {count !== undefined && <strong className="font-bold">{count} </strong>}
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

