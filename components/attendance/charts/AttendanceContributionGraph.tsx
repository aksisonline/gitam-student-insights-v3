import { useState, useEffect, useRef } from 'react';
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from '@/components/kibo-ui/contribution-graph';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatISO, eachDayOfInterval, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import type {
  CalendarGridCell,
  ClassInstance,
  TimetableData,
  AttendanceRecord,
  HolidayData,
} from '@/lib/types';
import { generateCalendarGrid } from '@/lib/attendance/attendanceCalculator';

interface AttendanceContributionGraphProps {
  timetableData: TimetableData;
  attendanceRecords: AttendanceRecord[];
  holidays: HolidayData[];
  onAttendanceChange?: (grid: CalendarGridCell[]) => void;
}

export function AttendanceContributionGraph({
  timetableData,
  attendanceRecords,
  holidays,
  onAttendanceChange,
}: AttendanceContributionGraphProps) {
  // Generate 3 months: previous, current, and next
  const today = new Date();
  const startDate = startOfMonth(addMonths(today, -1));
  const endDate = endOfMonth(addMonths(today, 1));

  const [grid, setGrid] = useState<CalendarGridCell[]>(() =>
    generateCalendarGrid(startDate, endDate, timetableData, attendanceRecords, holidays)
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<'present' | 'absent' | null>(null);
  const dragStartRef = useRef<{ date: string; classId: string } | null>(null);

  // Create a map to store cell data by date for easy lookup
  const cellDataMap = new Map<string, CalendarGridCell>();
  grid.forEach(cell => cellDataMap.set(cell.date, cell));

  // Convert grid to contribution graph format
  const contributionData = grid.map((cell) => {
    // Calculate level based on classes in this day
    const totalClasses = cell.classes.length;
    const presentClasses = cell.classes.filter(
      (cls) =>
        (cls.userOverride || cls.actualStatus) === 'present'
    ).length;
    const absentClasses = cell.classes.filter(
      (cls) =>
        (cls.userOverride || cls.actualStatus) === 'absent'
    ).length;

    // Level 0-4 based on attendance
    let level = 0;
    if (totalClasses > 0) {
      const percentage = (presentClasses / totalClasses) * 100;
      if (percentage >= 90) level = 4;
      else if (percentage >= 75) level = 3;
      else if (percentage >= 60) level = 2;
      else if (percentage > 0) level = 1;
      else level = 0;
    }

    return {
      date: cell.date,
      count: presentClasses,
      level: cell.isHoliday ? -1 : level, // -1 for holidays
    };
  });

  const handleCellClick = (date: string, classIndex: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((cell) => {
        if (cell.date === date && !cell.isHoliday) {
          const newClasses = [...cell.classes];
          if (newClasses[classIndex]) {
            const cls = newClasses[classIndex];
            const currentState = cls.userOverride || cls.actualStatus;

            // Cycle: null/normal → present → absent → null
            let newState: 'present' | 'absent' | undefined;
            if (!currentState) {
              newState = 'present';
            } else if (currentState === 'present') {
              newState = 'absent';
            } else {
              newState = undefined; // Reset to normal
            }

            newClasses[classIndex] = {
              ...cls,
              userOverride: newState,
            };
          }

          return { ...cell, classes: newClasses };
        }
        return cell;
      });

      onAttendanceChange?.(newGrid);
      return newGrid;
    });
  };

  const handleDragStart = (date: string, classId: string, state: 'present' | 'absent') => {
    setIsDragging(true);
    setDragState(state);
    dragStartRef.current = { date, classId };
  };

  const handleDragOver = (date: string) => {
    if (!isDragging || !dragState || !dragStartRef.current) return;

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((cell) => {
        if (cell.date === date && !cell.isHoliday) {
          // Apply drag state to all classes in this day (vertical priority)
          const newClasses = cell.classes.map((cls) => ({
            ...cls,
            userOverride: dragState,
          }));
          return { ...cell, classes: newClasses };
        }
        return cell;
      });

      return newGrid;
    });
  };

  const handleDragEnd = () => {
    if (grid) {
      onAttendanceChange?.(grid);
    }
    setIsDragging(false);
    setDragState(null);
    dragStartRef.current = null;
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, grid]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <ContributionGraph
          data={contributionData}
          blockSize={20}
          blockMargin={3}
          fontSize={12}
        >
          <ContributionGraphCalendar>
            {({ activity, dayIndex, weekIndex }) => {
              const cellData = cellDataMap.get(activity.date);
              const isHoliday = cellData?.isHoliday || false;

              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <g
                      onMouseEnter={() => {
                        if (isDragging && activity.date) {
                          handleDragOver(activity.date);
                        }
                      }}
                    >
                      <ContributionGraphBlock
                        activity={{
                          ...activity,
                          level: isHoliday ? 0 : activity.level,
                        }}
                        className={`cursor-pointer transition-all ${
                          isHoliday
                            ? 'opacity-40 cursor-not-allowed'
                            : isDragging
                            ? 'opacity-70'
                            : 'hover:opacity-80'
                        }`}
                        dayIndex={dayIndex}
                        weekIndex={weekIndex}
                        onClick={() => {
                          if (cellData && !isHoliday && cellData.classes.length > 0) {
                            // Click toggles first class, drag handles all
                            handleCellClick(activity.date, 0);
                          }
                        }}
                        onMouseDown={() => {
                          if (cellData && !isHoliday && cellData.classes.length > 0) {
                            const firstClass = cellData.classes[0];
                            const currentState = firstClass.userOverride || firstClass.actualStatus;
                            const nextState = !currentState ? 'present' : currentState === 'present' ? 'absent' : 'present';
                            handleDragStart(activity.date, firstClass.id, nextState);
                          }
                        }}
                      />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {cellData ? (
                      <div className="space-y-2">
                        <p className="font-semibold">
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {isHoliday ? (
                          <Badge variant="secondary" className="text-xs">
                            🎉 {cellData.holidayName || 'Holiday'}
                          </Badge>
                        ) : cellData.classes.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {cellData.classes.length} class{cellData.classes.length > 1 ? 'es' : ''}
                            </p>
                            {cellData.classes.map((cls, idx) => (
                              <div
                                key={cls.id}
                                className="text-xs p-1 rounded bg-secondary/50"
                              >
                                <div className="font-medium">{cls.subjectName}</div>
                                <div className="text-muted-foreground">
                                  {cls.startTime} - {cls.endTime}
                                </div>
                                <Badge
                                  variant={
                                    (cls.userOverride || cls.actualStatus) === 'present'
                                      ? 'default'
                                      : (cls.userOverride || cls.actualStatus) === 'absent'
                                      ? 'destructive'
                                      : 'outline'
                                  }
                                  className="text-xs mt-1"
                                >
                                  {cls.userOverride
                                    ? `Modified: ${cls.userOverride}`
                                    : cls.actualStatus || 'No data'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No classes scheduled</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs">No data</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }}
          </ContributionGraphCalendar>
          <ContributionGraphFooter>
            <ContributionGraphTotalCount>
              {({ totalCount, year }) => (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Period:</span>
                  <Badge variant="secondary">
                    {startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                    {endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Badge>
                </div>
              )}
            </ContributionGraphTotalCount>
            <ContributionGraphLegend>
              {({ level }) => {
                let bgColor = 'bg-muted';
                let label = 'No data';
                
                if (level === 0) {
                  bgColor = 'bg-red-200 dark:bg-red-900';
                  label = '0-59%';
                } else if (level === 1) {
                  bgColor = 'bg-orange-200 dark:bg-orange-900';
                  label = '60-74%';
                } else if (level === 2) {
                  bgColor = 'bg-emerald-200 dark:bg-emerald-800';
                  label = '75-89%';
                } else if (level === 3) {
                  bgColor = 'bg-emerald-400 dark:bg-emerald-600';
                  label = '90-94%';
                } else if (level === 4) {
                  bgColor = 'bg-emerald-600 dark:bg-emerald-400';
                  label = '95-100%';
                }

                return (
                  <div
                    className="group relative flex h-3 w-3 items-center justify-center"
                    data-level={level}
                  >
                    <div
                      className={`h-full w-full rounded-sm border border-border ${bgColor}`}
                    />
                    <span className="-top-8 absolute hidden rounded bg-popover px-2 py-1 text-popover-foreground text-xs shadow-md group-hover:block whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                );
              }}
            </ContributionGraphLegend>
          </ContributionGraphFooter>
        </ContributionGraph>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p className="font-medium">💡 How to use:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Click</strong> a day to toggle attendance for the first class</li>
            <li><strong>Click & Drag</strong> to fill multiple days (all classes per day)</li>
            <li><strong>Hover</strong> to see class details and timings</li>
            <li>States cycle: No data → Present (green) → Absent (red) → No data</li>
            <li>Holidays are greyed out and cannot be modified</li>
          </ul>
        </div>
      </div>
    </TooltipProvider>
  );
}

