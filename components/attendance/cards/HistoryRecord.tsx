import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import type { HistoryRecordProps } from '@/lib/types';

export function HistoryRecord({ record }: HistoryRecordProps) {
  // Parse DD-MM-YYYY format with robust error handling
  const parseDateSafely = (dateStr: string): Date => {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) {
        console.error('Invalid date format:', dateStr);
        return new Date(); // Fallback to today
      }
      
      const [day, month, year] = parts;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      // Validate parsed values
      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        console.error('Invalid date values:', { day, month, year });
        return new Date();
      }
      
      if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        console.error('Date out of range:', { day: dayNum, month: monthNum, year: yearNum });
        return new Date();
      }
      
      const date = new Date(yearNum, monthNum - 1, dayNum);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid Date object created from:', dateStr);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return new Date();
    }
  };
  
  const dateObj = parseDateSafely(record.date);
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center p-2 bg-muted rounded-md min-w-[60px]">
          <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-xs font-medium">
            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        <div className="space-y-1">
          <p className="font-medium text-sm">{record.subject}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{record.time}</span>
          </div>
        </div>
      </div>
      
      <Badge 
        variant={record.status === 'present' ? 'default' : 'destructive'}
        className="capitalize"
      >
        {record.status}
      </Badge>
    </div>
  );
}

