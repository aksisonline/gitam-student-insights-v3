import { Target, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { StatCard } from './cards/StatCard';
import type { AttendanceStats } from '@/lib/types';
import { getStatusColor } from '@/lib/attendance/attendanceHelpers';

interface StatsGridProps {
  stats: AttendanceStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Overall Attendance"
        value={`${stats.overallPercentage.toFixed(1)}%`}
        icon={Target}
        color="primary"
        trend={stats.overallPercentage >= 75 ? 'up' : 'down'}
        subtitle={`${stats.totalPresent} of ${stats.totalClasses} classes`}
        progress={stats.overallPercentage}
      />
      
      <StatCard
        title="Total Subjects"
        value={stats.totalSubjects}
        icon={BookOpen}
        color="blue-600"
        subtitle="Enrolled this semester"
      />
      
      <StatCard
        title="Safe Subjects"
        value={stats.safeSubjects}
        icon={CheckCircle}
        color="green-600"
        trend="up"
        subtitle="≥75% attendance"
        progress={(stats.safeSubjects / stats.totalSubjects) * 100}
      />
      
      <StatCard
        title="Risk Subjects"
        value={stats.riskSubjects}
        icon={AlertTriangle}
        color="red-600"
        trend={stats.riskSubjects > 0 ? 'down' : 'neutral'}
        subtitle={stats.riskSubjects > 0 ? 'Needs attention' : 'All clear!'}
        progress={(stats.riskSubjects / stats.totalSubjects) * 100}
      />
    </div>
  );
}

