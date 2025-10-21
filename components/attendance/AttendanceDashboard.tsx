import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, BookOpen, History, TrendingUp, Calculator, Award } from 'lucide-react';
import type { SubjectData, AttendanceStats, AttendanceRecord } from '@/lib/types';

// Import all modular components
import { AttendanceHeader } from './AttendanceHeader';
import { StatsGrid } from './StatsGrid';
import { SubjectBarChart } from './charts/SubjectBarChart';
import { DistributionPieChart } from './charts/DistributionPieChart';
import { SubjectsList } from './SubjectsList';
import { HistoryTab } from './HistoryTab';
import { TrendsTab } from './TrendsTab';
import { CalculatorTab } from './CalculatorTab';
import { AnalyticsTab } from './AnalyticsTab';
import { ProBadge } from './pro/ProBadge';

interface AttendanceDashboardProps {
  subjects?: SubjectData[];
  stats?: AttendanceStats;
  attendanceRecords?: AttendanceRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function AttendanceDashboard({
  subjects = [],
  stats,
  attendanceRecords = [],
  loading = false,
  error = null,
  onRefresh
}: AttendanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-primary absolute inset-0"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-base font-semibold text-foreground animate-pulse">Loading Attendance Data</p>
          <p className="text-sm text-muted-foreground">Please wait while we fetch your records...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center h-96 space-y-6 p-6">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full"></div>
            <AlertTriangle className="h-16 w-16 text-destructive relative z-10 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-destructive">Oops! Something went wrong</h3>
            <p className="text-muted-foreground max-w-md text-sm">{error}</p>
          </div>
          <Button onClick={onRefresh} variant="destructive" size="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!subjects.length || !stats) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-96 space-y-6 p-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
            <BookOpen className="h-16 w-16 text-muted-foreground relative z-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold">No Attendance Data Available</h3>
            <p className="text-muted-foreground max-w-md text-sm">
              We couldn't find any attendance records. Click refresh to load your data.
            </p>
          </div>
          <Button onClick={onRefresh} size="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main dashboard
  return (
    <div className="space-y-4 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <AttendanceHeader onRefresh={onRefresh} />

      {/* Stats Overview */}
      <StatsGrid stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid p-1 h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculator</span>
            <ProBadge />
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SubjectBarChart subjects={subjects} />
            <DistributionPieChart stats={stats} />
          </div>
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">All Subjects ({stats.totalSubjects})</h3>
              <SubjectsList subjects={subjects} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2">
          <HistoryTab attendanceRecords={attendanceRecords} />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="animate-in fade-in slide-in-from-bottom-2">
          <TrendsTab subjects={subjects} stats={stats} />
        </TabsContent>

        {/* Calculator Tab (PRO) */}
        <TabsContent value="calculator" className="animate-in fade-in slide-in-from-bottom-2">
          <CalculatorTab 
            subjects={subjects} 
            stats={stats} 
            attendanceRecords={attendanceRecords}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-2">
          <AnalyticsTab subjects={subjects} stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
