import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { ProFeatureLock } from './pro/ProFeatureLock';
import { AttendanceContributionGraph } from './charts/AttendanceContributionGraph';
import { hasFeatureAccess } from '@/lib/features/featureManager';
import { FeatureFlag, type SubjectData, type AttendanceRecord, type CalendarGridCell, type TimetableData, type HolidayData } from '@/lib/types';
import { calculateWhatIfScenario, generateCalendarGrid, resetUserOverrides } from '@/lib/attendance/attendanceCalculator';
import { fetchHolidays } from '@/lib/attendance/calendarHolidays';

interface CalculatorTabProps {
  subjects?: SubjectData[];
  stats?: {
    overallPercentage: number;
    totalClasses: number;
    totalPresent: number;
  };
  attendanceRecords?: AttendanceRecord[];
}

export function CalculatorTab({ subjects = [], stats, attendanceRecords = [] }: CalculatorTabProps) {
  const hasAccess = hasFeatureAccess(FeatureFlag.ATTENDANCE_CALCULATOR);

  // Mock timetable data - TODO: Replace with actual timetable API
  const mockTimetableData: TimetableData = {
    monday: [
      { subjectCode: 'CS401', subjectName: 'Computer Networks', startTime: '09:00 AM', endTime: '10:00 AM' },
      { subjectCode: 'CS402', subjectName: 'Database Systems', startTime: '10:30 AM', endTime: '11:30 AM' },
      { subjectCode: 'CS403', subjectName: 'Software Engineering', startTime: '02:00 PM', endTime: '03:00 PM' },
    ],
    tuesday: [
      { subjectCode: 'CS404', subjectName: 'Operating Systems', startTime: '09:00 AM', endTime: '10:00 AM' },
      { subjectCode: 'CS405', subjectName: 'Web Technologies', startTime: '11:00 AM', endTime: '12:00 PM' },
    ],
    wednesday: [
      { subjectCode: 'CS401', subjectName: 'Computer Networks', startTime: '09:00 AM', endTime: '10:00 AM' },
      { subjectCode: 'CS402', subjectName: 'Database Systems', startTime: '10:30 AM', endTime: '11:30 AM' },
      { subjectCode: 'CS403', subjectName: 'Software Engineering', startTime: '01:00 PM', endTime: '02:00 PM' },
      { subjectCode: 'CS404', subjectName: 'Operating Systems', startTime: '02:30 PM', endTime: '03:30 PM' },
    ],
    thursday: [
      { subjectCode: 'CS405', subjectName: 'Web Technologies', startTime: '10:00 AM', endTime: '11:00 AM' },
      { subjectCode: 'CS401', subjectName: 'Computer Networks', startTime: '02:00 PM', endTime: '03:00 PM' },
      { subjectCode: 'CS402', subjectName: 'Database Systems', startTime: '03:30 PM', endTime: '04:30 PM' },
    ],
    friday: [
      { subjectCode: 'CS403', subjectName: 'Software Engineering', startTime: '09:00 AM', endTime: '10:00 AM' },
      { subjectCode: 'CS404', subjectName: 'Operating Systems', startTime: '11:00 AM', endTime: '12:00 PM' },
    ],
    saturday: [
      { subjectCode: 'CS405', subjectName: 'Web Technologies', startTime: '09:00 AM', endTime: '10:00 AM' },
    ],
    sunday: [],
  };

  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [grid, setGrid] = useState<CalendarGridCell[] | null>(null);
  const [calculation, setCalculation] = useState<{
    newPercentage: number;
    impact: number;
    changedClasses: number;
  } | null>(null);

  useEffect(() => {
    // Fetch holidays
    fetchHolidays().then(setHolidays);
  }, []);

  const handleAttendanceChange = (newGrid: CalendarGridCell[]) => {
    setGrid(newGrid);

    // Calculate what-if scenario
    if (stats) {
      const result = calculateWhatIfScenario(
        newGrid,
        stats.overallPercentage,
        stats.totalClasses,
        stats.totalPresent
      );
      setCalculation(result);
    }
  };

  const handleReset = () => {
    setGrid(null);
    setCalculation(null);
  };

  if (!hasAccess) {
    return (
      <ProFeatureLock
        featureName="Attendance Calculator"
        description="Interactive what-if calculator with contribution-graph style calendar view. Click and drag to modify attendance, see real-time predictions, and plan your semester strategically with visual feedback."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Calculation Display */}
      {calculation && calculation.changedClasses > 0 && (
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">What-If Scenario</h4>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold">{calculation.newPercentage.toFixed(1)}%</span>
                  <Badge
                    variant={calculation.impact >= 0 ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {calculation.impact >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {calculation.impact >= 0 ? '+' : ''}
                    {calculation.impact.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {calculation.changedClasses} class{calculation.changedClasses > 1 ? 'es' : ''} modified
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Stats */}
      {stats && !calculation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Current Attendance</h4>
                <p className="text-3xl font-bold">{stats.overallPercentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalPresent} of {stats.totalClasses} classes
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline">Live Calculator</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contribution Graph */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Interactive Attendance Calendar
              </CardTitle>
              <CardDescription>
                Click or drag to modify attendance and see instant predictions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceContributionGraph
            timetableData={mockTimetableData}
            attendanceRecords={attendanceRecords}
            holidays={holidays}
            onAttendanceChange={handleAttendanceChange}
          />
        </CardContent>
      </Card>

      {/* Impact Summary */}
      {calculation && calculation.changedClasses > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Original</h4>
              <p className="text-2xl font-bold text-muted-foreground">
                {stats?.overallPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Predicted</h4>
              <p className="text-2xl font-bold text-primary">
                {calculation.newPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Change</h4>
              <p
                className={`text-2xl font-bold ${
                  calculation.impact >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {calculation.impact >= 0 ? '+' : ''}
                {calculation.impact.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
