import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Award, Calendar, CheckCircle, Clock, Target } from 'lucide-react';
import { InsightCard } from './cards/InsightCard';
import type { SubjectData, AttendanceStats } from '@/lib/types';

interface AnalyticsTabProps {
  subjects: SubjectData[];
  stats: AttendanceStats;
}

export function AnalyticsTab({ subjects, stats }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Performance Insights</h3>
        <div className="grid grid-cols-1 gap-4">
          {stats.riskSubjects > 0 && (
            <InsightCard
              type="danger"
              message={`subject${stats.riskSubjects > 1 ? 's' : ''} below 65% attendance. Immediate action needed to avoid academic penalties. Consider meeting with faculty advisors.`}
              icon={Target}
              count={stats.riskSubjects}
            />
          )}
          
          {stats.warningSubjects > 0 && (
            <InsightCard
              type="warning"
              message={`subject${stats.warningSubjects > 1 ? 's' : ''} in warning zone (65-74%). Stay consistent with attendance to maintain good standing.`}
              icon={Activity}
              count={stats.warningSubjects}
            />
          )}
          
          {stats.safeSubjects > 0 && (
            <InsightCard
              type="success"
              message={`subject${stats.safeSubjects > 1 ? 's' : ''} above 75% attendance. Outstanding commitment to your education. Keep up the excellent work!`}
              icon={Award}
              count={stats.safeSubjects}
            />
          )}
        </div>
      </div>

      {/* Quick Statistics */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Quick Statistics
          </CardTitle>
          <CardDescription>Comprehensive summary of your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-sm">Total Classes</span>
              </div>
              <span className="text-xl font-bold text-primary">{stats.totalClasses}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-sm text-green-900 dark:text-green-100">Present</span>
              </div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{stats.totalPresent}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-semibold text-sm text-red-900 dark:text-red-100">Absent</span>
              </div>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">{stats.totalAbsent}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-sm">Attendance Rate</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                {stats.overallPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

