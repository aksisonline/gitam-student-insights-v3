import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Target, AlertTriangle, TrendingDown } from 'lucide-react';
import type { SubjectCardProps } from '@/lib/types';
import { getStatusBgColor, getStatusColor, getStatusBadgeVariant } from '@/lib/attendance/attendanceHelpers';

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
  return (
    <Card 
      className={`relative overflow-hidden border-2 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${getStatusBgColor(subject.percentage)}`}
      onClick={onClick}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base">{subject.name}</h3>
                <Badge 
                  variant={getStatusBadgeVariant(subject.status)}
                  className="gap-1"
                >
                  {subject.status === 'safe' && <CheckCircle className="h-3 w-3" />}
                  {subject.status === 'warning' && <AlertTriangle className="h-3 w-3" />}
                  {subject.status === 'risk' && <TrendingDown className="h-3 w-3" />}
                  {subject.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono">{subject.code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="font-medium">{subject.present} Present</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-red-600" />
              <span className="font-medium">{subject.absent} Absent</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-blue-600" />
              <span className="font-medium">{subject.total} Total</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 min-w-[100px]">
          <div className={`text-3xl font-bold ${getStatusColor(subject.percentage)}`}>
            {subject.percentage.toFixed(1)}%
          </div>
          <Progress value={subject.percentage} className="w-full h-2" />
        </div>
      </div>
    </Card>
  );
}

