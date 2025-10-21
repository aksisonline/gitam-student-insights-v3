import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Calendar, Download, RefreshCw } from 'lucide-react';
import { HistoryRecord } from './cards/HistoryRecord';
import type { AttendanceRecord } from '@/lib/types';
import { fetchAttendanceHistory, formatHistoryForDisplay } from '@/lib/attendance/attendanceHistory';

interface HistoryTabProps {
  attendanceRecords?: AttendanceRecord[];
  onRefresh?: () => void;
}

export function HistoryTab({ attendanceRecords: propRecords, onRefresh }: HistoryTabProps) {
  const [groupBy, setGroupBy] = useState<'date' | 'subject'>('date');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>(propRecords || []);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount if not provided via props
  useEffect(() => {
    if (!propRecords || propRecords.length === 0) {
      loadHistory();
    }
  }, [propRecords]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRecords = await fetchAttendanceHistory();
      setRecords(fetchedRecords);
      
      if (fetchedRecords.length === 0) {
        setError('No attendance records found. Make sure you\'re logged in to GITAM portal.');
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load attendance history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadHistory();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mb-4"></div>
          <p className="text-muted-foreground">Loading attendance history...</p>
          <p className="text-xs text-muted-foreground mt-2">Fetching last 6 months of data</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-destructive">
            <History className="h-12 w-12 mx-auto mb-2" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-destructive">Error Loading History</h3>
            <p className="text-muted-foreground text-sm max-w-md">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
          <History className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold">No Attendance History</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Your attendance records will appear here once they're available.
              Make sure you're logged in to the GITAM student portal.
            </p>
          </div>
          <Button onClick={handleRefresh} size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formattedHistory = formatHistoryForDisplay(records, groupBy);

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Attendance History
            </CardTitle>
            <CardDescription>
              Complete timeline of your attendance records (last 6 months)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {records.length} Records
            </Badge>
            <Button onClick={handleRefresh} variant="ghost" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as 'date' | 'subject')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="date">By Date</TabsTrigger>
              <TabsTrigger value="subject">By Subject</TabsTrigger>
            </TabsList>
            
            {/* Export button - placeholder for PRO feature */}
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              Export
              <Badge variant="secondary" className="ml-1 text-xs">PRO</Badge>
            </Button>
          </div>
          
          <TabsContent value={groupBy} className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {formattedHistory.map((group, groupIndex) => (
              <div key={`${groupBy}-${groupIndex}`} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-2 z-10">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.records.map((record, index) => (
                    <HistoryRecord 
                      key={`${record.date}-${record.subject}-${record.time}-${index}`} 
                      record={record} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
