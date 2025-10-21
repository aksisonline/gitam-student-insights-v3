import type {
  CalendarGridCell,
  ClassInstance,
  AttendanceChange,
  TimetableData,
  HolidayData,
  AttendanceRecord,
} from '@/lib/types';
import { isHoliday, getHolidayForDate } from './calendarHolidays';
import { getLevelFromPercentage } from './attendanceHelpers';

/**
 * Generate calendar grid from timetable and attendance records
 */
export function generateCalendarGrid(
  startDate: Date,
  endDate: Date,
  timetableData: TimetableData,
  attendanceRecords: AttendanceRecord[],
  holidays: HolidayData[]
): CalendarGridCell[] {
  const grid: CalendarGridCell[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = dayNames[current.getDay()];
    
    // Check if this is a holiday
    const holidayData = getHolidayForDate(current, holidays);
    
    // Get classes for this day from timetable
    const daySchedule = timetableData[dayOfWeek.toLowerCase()] || [];
    
    // Create class instances
    const classes: ClassInstance[] = daySchedule.map((entry, index) => {
      const classId = `${dateStr}-${entry.subjectCode}-${index}`;
      
      // Find if there's an attendance record for this class
      const record = attendanceRecords.find(r =>
        r.date === dateStr && r.subject.includes(entry.subjectCode)
      );
      
      const actualStatus = record ? record.status : null;
      const percentage = record ? (record.status === 'present' ? 100 : 0) : 50;
      
      return {
        id: classId,
        subjectCode: entry.subjectCode,
        subjectName: entry.subjectName || entry.subjectCode,
        startTime: entry.startTime,
        endTime: entry.endTime,
        actualStatus: actualStatus,
        userOverride: undefined,
        level: getLevelFromPercentage(percentage),
      };
    });
    
    grid.push({
      date: dateStr,
      dayOfWeek: dayOfWeek,
      classes: classes,
      isHoliday: holidayData !== null,
      holidayName: holidayData?.name,
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return grid;
}

/**
 * Toggle attendance state: normal → present → absent → normal
 */
export function toggleAttendanceState(
  classInstance: ClassInstance
): 'present' | 'absent' | undefined {
  const current = classInstance.userOverride || classInstance.actualStatus;
  
  if (!current) {
    return 'present';
  } else if (current === 'present') {
    return 'absent';
  } else {
    return undefined; // Reset to normal
  }
}

/**
 * Handle drag-to-fill functionality
 * Vertical priority: fill entire column (all classes in a day) first
 * Horizontal: fill all days in range with all their classes
 */
export function handleDragFill(
  startCell: CalendarGridCell,
  endCell: CalendarGridCell,
  attendanceState: 'present' | 'absent',
  grid: CalendarGridCell[]
): AttendanceChange[] {
  const changes: AttendanceChange[] = [];
  
  // Vertical priority: if same day, fill all classes in that day
  if (startCell.date === endCell.date) {
    startCell.classes.forEach(cls => {
      if (!startCell.isHoliday) {
        changes.push({
          date: startCell.date,
          classId: cls.id,
          from: cls.userOverride || cls.actualStatus,
          to: attendanceState,
        });
      }
    });
  } else {
    // Horizontal: fill all days between start and end
    const startDate = new Date(startCell.date);
    const endDate = new Date(endCell.date);
    
    // Ensure startDate is before endDate
    const [begin, finish] = startDate < endDate ? [startDate, endDate] : [endDate, startDate];
    
    const current = new Date(begin);
    while (current <= finish) {
      const dateStr = current.toISOString().split('T')[0];
      const cell = grid.find(c => c.date === dateStr);
      
      if (cell && !cell.isHoliday) {
        cell.classes.forEach(cls => {
          changes.push({
            date: dateStr,
            classId: cls.id,
            from: cls.userOverride || cls.actualStatus,
            to: attendanceState,
          });
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
  }
  
  return changes;
}

/**
 * Apply attendance pattern across selected cells
 */
export function applyDragPattern(
  grid: CalendarGridCell[],
  changes: AttendanceChange[]
): CalendarGridCell[] {
  const updatedGrid = grid.map(cell => ({
    ...cell,
    classes: cell.classes.map(cls => {
      const change = changes.find(c => c.classId === cls.id);
      if (change) {
        return {
          ...cls,
          userOverride: change.to,
          level: getLevelFromPercentage(change.to === 'present' ? 100 : 0),
        };
      }
      return cls;
    }),
  }));
  
  return updatedGrid;
}

/**
 * Calculate what-if scenario with user changes
 */
export function calculateWhatIfScenario(
  grid: CalendarGridCell[],
  currentPercentage: number,
  totalClasses: number,
  presentClasses: number
): {
  newPercentage: number;
  newTotalClasses: number;
  newPresentClasses: number;
  impact: number;
  changedClasses: number;
} {
  let additionalPresent = 0;
  let additionalAbsent = 0;
  let changedClasses = 0;
  
  grid.forEach(cell => {
    if (!cell.isHoliday) {
      cell.classes.forEach(cls => {
        if (cls.userOverride) {
          changedClasses++;
          
          // Count the impact based on what changed
          if (cls.userOverride === 'present') {
            if (cls.actualStatus === 'absent') {
              additionalPresent++;
              additionalAbsent--;
            } else if (cls.actualStatus === null) {
              additionalPresent++;
            }
          } else if (cls.userOverride === 'absent') {
            if (cls.actualStatus === 'present') {
              additionalPresent--;
              additionalAbsent++;
            } else if (cls.actualStatus === null) {
              additionalAbsent++;
            }
          }
        }
      });
    }
  });
  
  const newPresentClasses = presentClasses + additionalPresent;
  const newTotalClasses = totalClasses + (additionalPresent + additionalAbsent);
  const newPercentage = newTotalClasses > 0
    ? (newPresentClasses / newTotalClasses) * 100
    : currentPercentage;
  const impact = newPercentage - currentPercentage;
  
  return {
    newPercentage,
    newTotalClasses,
    newPresentClasses,
    impact,
    changedClasses,
  };
}

/**
 * Reset all user overrides in the grid
 */
export function resetUserOverrides(grid: CalendarGridCell[]): CalendarGridCell[] {
  return grid.map(cell => ({
    ...cell,
    classes: cell.classes.map(cls => ({
      ...cls,
      userOverride: undefined,
      level: getLevelFromPercentage(
        cls.actualStatus === 'present' ? 100 : cls.actualStatus === 'absent' ? 0 : 50
      ),
    })),
  }));
}

