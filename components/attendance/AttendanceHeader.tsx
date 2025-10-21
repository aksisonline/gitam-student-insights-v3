import { Button } from '@/components/ui/button';
import { RefreshCw, Activity } from 'lucide-react';

interface AttendanceHeaderProps {
  onRefresh?: () => void;
}

export function AttendanceHeader({ onRefresh }: AttendanceHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track your academic journey with precision</p>
        </div>
      </div>
      <Button 
        onClick={onRefresh} 
        variant="outline" 
        size="default" 
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}

