import type { AttendanceRecord } from '@/lib/types';

/**
 * Fetch attendance history from GITAM API
 * Uses the same endpoint as GITAM_Pro_Max
 */
export async function fetchAttendanceHistory(): Promise<AttendanceRecord[]> {
  try {
    // Calculate date range (last 6 months to ensure we get enough data)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    // Format dates as DD-MM-YYYY to match GITAM API format
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    const dateRange = `${startDateStr}%20to%20${endDateStr}`;
    
    const apiUrl = `https://gstudent.gitam.edu/Home/GetAttendancedata?category=Custom%20Range&date=${dateRange}`;
    
    console.log('Fetching attendance history from:', apiUrl);
    
    // Check if we're on the right domain
    if (!window.location.href.includes('gstudent.gitam.edu')) {
      console.warn('Not on GITAM student portal, cannot fetch attendance data');
      return [];
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Requested-With': 'XMLHttpRequest',
      }
    });
    
    // Check if we got redirected to login page
    if (response.url.includes('Login.aspx') || response.url.includes('login.gitam.edu')) {
      console.warn('Redirected to login page - user not authenticated');
      return [];
    }
    
    if (response.ok) {
      const htmlData = await response.text();
      return parseAttendanceHistoryHTML(htmlData);
    } else {
      console.error('Failed to fetch attendance data:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return [];
  }
}

/**
 * Parse attendance history from HTML response
 */
function parseAttendanceHistoryHTML(htmlData: string): AttendanceRecord[] {
  console.log('Parsing attendance history HTML...');
  
  // Check if HTML contains login page or error content
  if (htmlData.includes('Login.aspx') || htmlData.includes('login.gitam.edu')) {
    console.warn('Received login page instead of attendance data');
    return [];
  }
  
  // Create temporary DOM to parse HTML response
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlData;
  
  // Look for the attendance table (same selectors as GITAM_Pro_Max)
  const table = tempDiv.querySelector('#myTablevend1, table.table-bordered');
  
  if (!table) {
    console.warn('No attendance table found in response');
    return [];
  }
  
  const rows = table.querySelectorAll('tbody tr');
  console.log(`Found ${rows.length} attendance records`);
  
  if (rows.length === 0) {
    console.warn('Attendance table is empty');
    return [];
  }
  
  const attendanceRecords: AttendanceRecord[] = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      const dateTime = cells[0]?.textContent?.trim();
      const courseName = cells[1]?.textContent?.trim();
      const facultyName = cells[2]?.textContent?.trim();
      const statusText = cells[3]?.textContent?.trim();
      
      if (dateTime && courseName && statusText) {
        // Extract date and time parts
        // Format: "DD-MM-YYYY HH:MM" (e.g., "21-10-2025 08:00")
        const datePart = dateTime.split(' ')[0]; // DD-MM-YYYY
        const timePart = dateTime.split(' ').slice(1).join(' ') || ''; // HH:MM (24-hour format)
        
        // Log first few records to help debug date format
        if (attendanceRecords.length < 3) {
          console.log('📅 Parsing attendance record:', {
            raw: dateTime,
            datePart,
            timePart,
            courseName,
            status: statusText
          });
        }
        
        const record: AttendanceRecord = {
          date: datePart, // Keep as DD-MM-YYYY
          subject: courseName,
          status: statusText === 'Present' ? 'present' : 'absent',
          time: timePart,
        };
        
        attendanceRecords.push(record);
      }
    }
  });
  
  console.log(`Parsed ${attendanceRecords.length} attendance records`);
  return attendanceRecords;
}

/**
 * Group attendance records by date
 */
export function groupByDate(records: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const grouped = new Map<string, AttendanceRecord[]>();
  
  records.forEach(record => {
    const date = record.date;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(record);
  });
  
  return grouped;
}

/**
 * Group attendance records by subject
 */
export function groupBySubject(records: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const grouped = new Map<string, AttendanceRecord[]>();
  
  records.forEach(record => {
    const subject = record.subject;
    if (!grouped.has(subject)) {
      grouped.set(subject, []);
    }
    grouped.get(subject)!.push(record);
  });
  
  return grouped;
}

/**
 * Format history data for timeline display
 */
export function formatHistoryForDisplay(
  records: AttendanceRecord[],
  groupBy: 'date' | 'subject' = 'date'
): Array<{ title: string; records: AttendanceRecord[] }> {
  const formatted: Array<{ title: string; records: AttendanceRecord[] }> = [];
  
  if (groupBy === 'date') {
    const grouped = groupByDate(records);
    // Sort by date descending (newest first)
    // Convert DD-MM-YYYY to sortable format for comparison
    const sortedDates = Array.from(grouped.keys()).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('-');
      const [dayB, monthB, yearB] = b.split('-');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
    
    sortedDates.forEach((date) => {
      const dateRecords = grouped.get(date)!;
      // Parse DD-MM-YYYY format
      const [day, month, year] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      formatted.push({
        title: dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        records: dateRecords.sort((a, b) => a.time.localeCompare(b.time))
      });
    });
  } else {
    const grouped = groupBySubject(records);
    // Sort by subject name
    const sortedSubjects = Array.from(grouped.keys()).sort();
    
    sortedSubjects.forEach((subject) => {
      const subjectRecords = grouped.get(subject)!;
      // Sort records by date (newest first) - handle DD-MM-YYYY format
      const sortedRecords = subjectRecords.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('-');
        const [dayB, monthB, yearB] = b.date.split('-');
        const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
        return dateB.getTime() - dateA.getTime();
      });
      
      formatted.push({
        title: subject,
        records: sortedRecords
      });
    });
  }
  
  return formatted;
}

/**
 * Export history data (PRO feature)
 * TODO: Implement export functionality
 */
export function exportHistory(
  records: AttendanceRecord[],
  format: 'csv' | 'json' | 'pdf' = 'csv'
): void {
  // Placeholder for PRO feature
  console.log(`Exporting ${records.length} records as ${format}`);
  
  if (format === 'csv') {
    const csv = [
      'Date,Subject,Status,Time',
      ...records.map(r => `${r.date},${r.subject},${r.status},${r.time}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else if (format === 'json') {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Filter records by date range
 */
export function filterByDateRange(
  records: AttendanceRecord[],
  startDate: string,
  endDate: string
): AttendanceRecord[] {
  // Parse DD-MM-YYYY format
  const [startDay, startMonth, startYear] = startDate.split('-');
  const [endDay, endMonth, endYear] = endDate.split('-');
  const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
  const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
  
  return records.filter(record => {
    const [day, month, year] = record.date.split('-');
    const recordDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return recordDate >= start && recordDate <= end;
  });
}

/**
 * Filter records by subject
 */
export function filterBySubject(
  records: AttendanceRecord[],
  subjectName: string
): AttendanceRecord[] {
  return records.filter(record => 
    record.subject.toLowerCase().includes(subjectName.toLowerCase())
  );
}

/**
 * Filter records by status
 */
export function filterByStatus(
  records: AttendanceRecord[],
  status: 'present' | 'absent'
): AttendanceRecord[] {
  return records.filter(record => record.status === status);
}

/**
 * Get attendance statistics from records
 */
export function getHistoryStats(records: AttendanceRecord[]): {
  totalClasses: number;
  present: number;
  absent: number;
  percentage: number;
  bySubject: Map<string, { present: number; total: number; percentage: number }>;
} {
  const totalClasses = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = totalClasses - present;
  const percentage = totalClasses > 0 ? (present / totalClasses) * 100 : 0;
  
  // Calculate per-subject stats
  const bySubject = new Map<string, { present: number; total: number; percentage: number }>();
  
  records.forEach(record => {
    if (!bySubject.has(record.subject)) {
      bySubject.set(record.subject, { present: 0, total: 0, percentage: 0 });
    }
    
    const stats = bySubject.get(record.subject)!;
    stats.total++;
    if (record.status === 'present') {
      stats.present++;
    }
    stats.percentage = (stats.present / stats.total) * 100;
  });
  
  return {
    totalClasses,
    present,
    absent,
    percentage,
    bySubject,
  };
}
