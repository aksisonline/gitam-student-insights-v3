import type { SubjectData, AttendanceStats, AttendanceChange } from '@/lib/types';
import { getAttendanceStatus } from './attendanceHelpers';

/**
 * Calculate overall attendance statistics
 */
export function calculateOverallStats(subjects: SubjectData[]): AttendanceStats {
  if (!subjects || subjects.length === 0) {
    return {
      overallPercentage: 0,
      totalSubjects: 0,
      safeSubjects: 0,
      warningSubjects: 0,
      riskSubjects: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalClasses: 0,
    };
  }

  const totalPresent = subjects.reduce((sum, subject) => sum + subject.present, 0);
  const totalClasses = subjects.reduce((sum, subject) => sum + subject.total, 0);
  const totalAbsent = totalClasses - totalPresent;
  const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  const safeSubjects = subjects.filter(s => s.status === 'safe').length;
  const warningSubjects = subjects.filter(s => s.status === 'warning').length;
  const riskSubjects = subjects.filter(s => s.status === 'risk').length;

  return {
    overallPercentage,
    totalSubjects: subjects.length,
    safeSubjects,
    warningSubjects,
    riskSubjects,
    totalPresent,
    totalAbsent,
    totalClasses,
  };
}

/**
 * Calculate subject status based on percentage
 */
export function calculateSubjectStatus(subject: SubjectData): SubjectData {
  const percentage = subject.total > 0 ? (subject.present / subject.total) * 100 : 0;
  const status = getAttendanceStatus(percentage);
  
  return {
    ...subject,
    percentage,
    status,
  };
}

/**
 * Calculate trend direction based on historical data
 */
export function calculateTrendDirection(
  currentPercentage: number,
  previousPercentage: number
): 'up' | 'down' | 'neutral' {
  const diff = currentPercentage - previousPercentage;
  if (diff > 0.5) return 'up';
  if (diff < -0.5) return 'down';
  return 'neutral';
}

/**
 * Calculate number of classes needed to reach target percentage
 */
export function calculateClassesNeeded(
  currentPresent: number,
  currentTotal: number,
  targetPercentage: number = 75
): number {
  if (currentTotal === 0) return 0;
  
  const currentPercentage = (currentPresent / currentTotal) * 100;
  
  if (currentPercentage >= targetPercentage) {
    return 0; // Already at or above target
  }
  
  // Formula: (currentPresent + x) / (currentTotal + x) = targetPercentage / 100
  // Solving for x:
  // currentPresent + x = (targetPercentage / 100) * (currentTotal + x)
  // currentPresent + x = (targetPercentage / 100) * currentTotal + (targetPercentage / 100) * x
  // x - (targetPercentage / 100) * x = (targetPercentage / 100) * currentTotal - currentPresent
  // x * (1 - targetPercentage / 100) = (targetPercentage / 100) * currentTotal - currentPresent
  // x = ((targetPercentage / 100) * currentTotal - currentPresent) / (1 - targetPercentage / 100)
  
  const x = ((targetPercentage / 100) * currentTotal - currentPresent) / (1 - targetPercentage / 100);
  
  return Math.ceil(Math.max(0, x));
}

/**
 * Recalculate attendance with hypothetical changes
 */
export function recalculateWithChanges(
  subjects: SubjectData[],
  changes: AttendanceChange[]
): {
  newStats: AttendanceStats;
  newSubjects: SubjectData[];
  impact: number;
} {
  // Create a copy of subjects to modify
  const modifiedSubjects = subjects.map(subject => ({ ...subject }));
  
  // Apply changes (this is a simplified version - in real implementation, 
  // you'd need to track which changes affect which subjects)
  changes.forEach(change => {
    // Find the subject that this change affects
    // This is placeholder logic - actual implementation would need
    // to map classId to subject
    const subject = modifiedSubjects.find(s => 
      change.classId.includes(s.code)
    );
    
    if (subject) {
      if (change.to === 'present' && change.from !== 'present') {
        subject.present += 1;
        if (change.from === 'absent') {
          subject.absent -= 1;
        } else {
          subject.total += 1;
        }
      } else if (change.to === 'absent' && change.from !== 'absent') {
        subject.absent += 1;
        if (change.from === 'present') {
          subject.present -= 1;
        } else {
          subject.total += 1;
        }
      }
      
      // Recalculate percentage and status
      subject.percentage = subject.total > 0 ? (subject.present / subject.total) * 100 : 0;
      subject.status = getAttendanceStatus(subject.percentage);
    }
  });
  
  const newStats = calculateOverallStats(modifiedSubjects);
  const oldStats = calculateOverallStats(subjects);
  const impact = newStats.overallPercentage - oldStats.overallPercentage;
  
  return {
    newStats,
    newSubjects: modifiedSubjects,
    impact,
  };
}

/**
 * Calculate attendance rate for a specific time period
 */
export function calculatePeriodAttendanceRate(
  records: { status: 'present' | 'absent' }[],
  days: number
): number {
  if (records.length === 0) return 0;
  
  const recentRecords = records.slice(-days);
  const present = recentRecords.filter(r => r.status === 'present').length;
  
  return recentRecords.length > 0 ? (present / recentRecords.length) * 100 : 0;
}

