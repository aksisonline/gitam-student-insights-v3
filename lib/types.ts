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
