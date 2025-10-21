export interface SubjectData {
  code: string;
  name: string;
  percentage: number;
  status: 'safe' | 'warning' | 'risk';
  present: number;
  total: number;
  absent: number;
}

export interface AttendanceStats {
  overallPercentage: number;
  totalSubjects: number;
  safeSubjects: number;
  warningSubjects: number;
  riskSubjects: number;
  totalPresent: number;
  totalAbsent: number;
  totalClasses: number;
}

export interface AttendanceRecord {
  date: string;
  subject: string;
  status: 'present' | 'absent';
  time: string;
}

export interface GitamApiResponse {
  success: boolean;
  data: any;
  message?: string;
}

export interface PageContext {
  type: 'login' | 'attendance' | 'timetable' | 'unknown';
  url: string;
  isGitamPortal: boolean;
}

// Attendance Trend & Prediction Types
export interface AttendanceTrendData {
  date: string;
  day: string;
  attendance: number;
  totalClasses: number;
  presentClasses: number;
  isScheduledDay: boolean;
  hasRecords: boolean;
}

export interface PredictionDetail {
  date: Date;
  dayName: string;
  expectedClasses: number;
  bestCasePresent: number;
  worstCasePresent: number;
  predictedPresent: number;
  totalClasses: number;
  dayAttendanceProb: number;
  adjustedProb: number;
  trendFactor: number;
}

export interface PredictionData {
  bestCase: number[];
  worstCase: number[];
  predicted: number[];
  labels: string[];
  detailedData: PredictionDetail[];
}

export interface DailyAttendanceRecord {
  day: string;
  date: string;
  attendance: number;
  present: number;
  total: number;
  presentToday: number;
  isScheduledDay: boolean;
  hasRecords: boolean;
}

// Calculator Types
export interface CalendarGridCell {
  date: string;
  dayOfWeek: string;
  classes: ClassInstance[];
  isHoliday: boolean;
  holidayName?: string;
}

export interface ClassInstance {
  id: string;
  subjectCode: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  actualStatus: 'present' | 'absent' | null;
  userOverride?: 'present' | 'absent';
  level: number; // 0-4 for contribution graph
}

export interface AttendanceChange {
  date: string;
  classId: string;
  from: 'present' | 'absent' | null;
  to: 'present' | 'absent';
}

export interface TimetableData {
  [day: string]: TimetableEntry[];
}

export interface TimetableEntry {
  subjectCode: string;
  subjectName?: string;
  startTime: string;
  endTime: string;
}

export interface HolidayData {
  date: string;
  name: string;
  type: 'holiday' | 'exam' | 'break';
}

export interface TimetablePattern {
  [day: string]: number; // day name to expected class count
}

// Feature System Types
export enum FeatureFlag {
  ATTENDANCE_HISTORY = 'attendance_history',
  ATTENDANCE_OVERVIEW = 'attendance_overview',
  ATTENDANCE_TRENDS = 'attendance_trends',
  ATTENDANCE_CALCULATOR = 'attendance_calculator',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  EXPORT_DATA = 'export_data',
}

export interface Feature {
  id: FeatureFlag;
  name: string;
  description: string;
  isPro: boolean;
  icon: string;
  category: 'attendance' | 'analytics' | 'export';
}

export interface UserFeaturePreferences {
  [featureId: string]: boolean;
}

// Component Props Types
export interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  progress?: number;
}

export interface SubjectCardProps {
  subject: SubjectData;
  onClick?: () => void;
}

export interface InsightCardProps {
  type: 'danger' | 'warning' | 'success';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface HistoryRecordProps {
  record: AttendanceRecord;
}

export interface ProFeatureLockProps {
  featureName: string;
  description?: string;
  previewImage?: string;
}