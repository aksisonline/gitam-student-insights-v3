import type {
  AttendanceTrendData,
  PredictionData,
  PredictionDetail,
  DailyAttendanceRecord,
  TimetablePattern,
  SubjectData,
} from '@/lib/types';

/**
 * Generate daily attendance data for a given number of days
 * @param days Number of days to generate data for
 * @param subjects Subject data for realistic patterns
 * @param overallPercentage Current overall attendance percentage
 * @returns Array of daily attendance records
 */
export function generateDailyAttendanceData(
  days: number,
  subjects?: SubjectData[],
  overallPercentage?: number
): DailyAttendanceRecord[] {
  const data: DailyAttendanceRecord[] = [];
  const today = new Date();
  
  let cumulativeTotal = 0;
  let cumulativePresent = 0;
  
  const defaultPercentage = overallPercentage || (subjects && subjects.length > 0
    ? subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length
    : 75);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if this day has scheduled classes
    let expectedClasses = 3; // Default assumption
    let hasClass = true;
    
    // Default pattern: skip Sundays, reduce Saturday classes
    if (dayName === 'Sunday') {
      hasClass = false;
      expectedClasses = 0;
    } else if (dayName === 'Saturday') {
      expectedClasses = 1;
      hasClass = Math.random() > 0.3; // 70% chance
    } else {
      hasClass = Math.random() > 0.2; // 80% chance on weekdays
    }
    
    let dailyPresent = 0;
    let dailyTotal = 0;
    
    if (hasClass && expectedClasses > 0) {
      dailyTotal = expectedClasses;
      cumulativeTotal += dailyTotal;
      
      // Generate realistic attendance based on day patterns
      let attendanceRate = defaultPercentage / 100;
      
      // Day-specific attendance patterns
      switch (dayName) {
        case 'Monday':
          attendanceRate *= 0.9;
          break; // Lower on Mondays
        case 'Tuesday':
          attendanceRate *= 1.1;
          break; // Higher mid-week
        case 'Wednesday':
          attendanceRate *= 1.1;
          break;
        case 'Thursday':
          attendanceRate *= 1.0;
          break;
        case 'Friday':
          attendanceRate *= 0.85;
          break; // Lower on Fridays
        case 'Saturday':
          attendanceRate *= 0.7;
          break; // Lowest on Saturdays
      }
      
      // Add some randomness
      attendanceRate += (Math.random() - 0.5) * 0.2;
      attendanceRate = Math.max(0, Math.min(1, attendanceRate));
      
      dailyPresent = Math.round(dailyTotal * attendanceRate);
      cumulativePresent += dailyPresent;
    }
    
    const percentage = cumulativeTotal > 0
      ? Math.round((cumulativePresent / cumulativeTotal) * 100)
      : 0;
    
    data.push({
      date: dateStr,
      day: dayStr,
      attendance: percentage,
      present: cumulativePresent,
      total: cumulativeTotal,
      presentToday: dailyPresent,
      isScheduledDay: hasClass,
      hasRecords: false,
    });
  }
  
  return data;
}

/**
 * Calculate exponential smoothing for trend analysis
 * @param data Array of values to smooth
 * @param alpha Smoothing factor (0-1), default 0.3
 * @returns Smoothed values
 */
export function calculateExponentialSmoothing(
  data: number[],
  alpha: number = 0.3
): number[] {
  if (data.length === 0) return [];
  
  const smoothed = [data[0]];
  for (let i = 1; i < data.length; i++) {
    smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
  }
  return smoothed;
}

/**
 * Analyze timetable patterns to determine expected classes per day
 * Returns a default conservative pattern
 * TODO: In production, fetch actual timetable from API
 */
export function analyzeTimetablePatterns(): TimetablePattern {
  // Default conservative pattern
  // TODO: Replace with actual timetable API call
  return {
    monday: 3,
    tuesday: 2,
    wednesday: 4,
    thursday: 3,
    friday: 2,
    saturday: 1,
    sunday: 0,
  };
}

/**
 * Generate 5-day attendance predictions
 * @param historicalData Historical attendance data
 * @param timetablePattern Optional timetable pattern override
 * @returns Prediction data with best/worst/predicted cases
 */
export function generatePredictionData(
  historicalData: DailyAttendanceRecord[],
  timetablePattern?: TimetablePattern
): PredictionData {
  const today = new Date();
  const timetable = timetablePattern || analyzeTimetablePatterns();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Calculate exponential smoothing for trend
  const attendanceValues = historicalData.map(d => d.attendance);
  const smoothed = calculateExponentialSmoothing(attendanceValues);
  const currentTrend = smoothed[smoothed.length - 1];
  
  // Analyze recent attendance behavior
  const recentDays = Math.min(7, historicalData.length);
  const recentData = historicalData.slice(-recentDays);
  const recentAttendanceRate = recentData.reduce((sum, day) => {
    if (day.total > 0) {
      return sum + (day.present / day.total);
    }
    return sum + (day.attendance / 100);
  }, 0) / recentData.length;
  
  // Calculate day-of-week attendance patterns
  const dayAttendancePatterns: Record<string, number> = {};
  dayNames.forEach(day => {
    dayAttendancePatterns[day] = recentAttendanceRate;
  });
  
  const predictions: PredictionData = {
    bestCase: [],
    worstCase: [],
    predicted: [],
    labels: [],
    detailedData: [],
  };
  
  // Get current totals from last historical point
  const lastData = historicalData[historicalData.length - 1];
  let currentTotal = lastData.total || 0;
  let bestCasePresent = lastData.present || 0;
  let worstCasePresent = lastData.present || 0;
  let predictedPresent = lastData.present || 0;
  
  for (let i = 1; i <= 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayName = dayNames[futureDate.getDay()];
    const expectedClasses = timetable[dayName] || 0;
    
    const label = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    predictions.labels.push(label);
    
    // Calculate trend factor
    const trendFactor = Math.max(0.1, Math.min(0.9, currentTrend / 100));
    
    // Skip days with no classes scheduled
    if (expectedClasses === 0) {
      const unchangedPercentage = currentTotal > 0
        ? Math.round((bestCasePresent / currentTotal) * 100)
        : 0;
      
      predictions.bestCase.push(unchangedPercentage);
      predictions.worstCase.push(unchangedPercentage);
      predictions.predicted.push(unchangedPercentage);
      
      predictions.detailedData.push({
        date: futureDate,
        dayName: dayName,
        expectedClasses: 0,
        bestCasePresent: Math.round(bestCasePresent),
        worstCasePresent: Math.round(worstCasePresent),
        predictedPresent: Math.round(predictedPresent * 10) / 10,
        totalClasses: currentTotal,
        dayAttendanceProb: 0,
        adjustedProb: 0,
        trendFactor: Math.round(trendFactor * 100),
      });
      continue;
    }
    
    // Add classes for this specific day
    currentTotal += expectedClasses;
    
    // Best case: attend all classes for this day
    bestCasePresent += expectedClasses;
    const bestPercentage = currentTotal > 0
      ? Math.round((bestCasePresent / currentTotal) * 100)
      : 0;
    
    // Worst case: miss all classes for this day
    const worstPercentage = currentTotal > 0
      ? Math.round((worstCasePresent / currentTotal) * 100)
      : 0;
    
    // Predicted case: use ML-based prediction
    const dayAttendanceProb = dayAttendancePatterns[dayName] || recentAttendanceRate;
    
    // Apply trend factor
    const adjustedProb = (dayAttendanceProb * 0.7) + (trendFactor * 0.3);
    
    // Calculate expected attendance for this day
    const expectedAttendance = expectedClasses * adjustedProb;
    predictedPresent += expectedAttendance;
    
    const predictedPercentage = currentTotal > 0
      ? Math.round((predictedPresent / currentTotal) * 100)
      : 0;
    
    predictions.bestCase.push(bestPercentage);
    predictions.worstCase.push(worstPercentage);
    predictions.predicted.push(predictedPercentage);
    
    predictions.detailedData.push({
      date: futureDate,
      dayName: dayName,
      expectedClasses: expectedClasses,
      bestCasePresent: Math.round(bestCasePresent),
      worstCasePresent: Math.round(worstCasePresent),
      predictedPresent: Math.round(predictedPresent * 10) / 10,
      totalClasses: currentTotal,
      dayAttendanceProb: Math.round(dayAttendanceProb * 100),
      adjustedProb: Math.round(adjustedProb * 100),
      trendFactor: Math.round(trendFactor * 100),
    });
  }
  
  return predictions;
}

