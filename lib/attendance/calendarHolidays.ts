import type { HolidayData } from '@/lib/types';

/**
 * Fetch holidays from backend API based on semester
 * TODO: Connect to actual backend API
 * This is a placeholder that returns mock data
 * 
 * In production, this will:
 * 1. Get user's semester from Firebase/storage
 * 2. Fetch holidays from backend API for that semester
 * 3. Cache the data locally
 */
export async function fetchHolidays(semester?: string): Promise<HolidayData[]> {
  // Placeholder - mock holidays for 2024
  // TODO: Replace with actual API call
  // Example: const response = await fetch(`/api/holidays?semester=${semester}`);
  
  const mockHolidays: HolidayData[] = [
    { date: '2024-01-26', name: 'Republic Day', type: 'holiday' },
    { date: '2024-03-08', name: 'Maha Shivaratri', type: 'holiday' },
    { date: '2024-03-25', name: 'Holi', type: 'holiday' },
    { date: '2024-04-11', name: 'Eid al-Fitr', type: 'holiday' },
    { date: '2024-04-17', name: 'Ram Navami', type: 'holiday' },
    { date: '2024-04-21', name: 'Mahavir Jayanti', type: 'holiday' },
    { date: '2024-08-15', name: 'Independence Day', type: 'holiday' },
    { date: '2024-08-26', name: 'Janmashtami', type: 'holiday' },
    { date: '2024-10-02', name: 'Gandhi Jayanti', type: 'holiday' },
    { date: '2024-10-12', name: 'Dussehra', type: 'holiday' },
    { date: '2024-10-31', name: 'Diwali', type: 'holiday' },
    { date: '2024-11-15', name: 'Guru Nanak Jayanti', type: 'holiday' },
    { date: '2024-12-25', name: 'Christmas', type: 'holiday' },
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockHolidays;
}

/**
 * Check if a given date is a holiday
 */
export function isHoliday(date: Date, holidays: HolidayData[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateStr);
}

/**
 * Get holiday details for a specific date
 */
export function getHolidayForDate(date: Date, holidays: HolidayData[]): HolidayData | null {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.find(holiday => holiday.date === dateStr) || null;
}

/**
 * Get all holidays in a date range
 */
export function getHolidaysInRange(
  startDate: Date,
  endDate: Date,
  holidays: HolidayData[]
): HolidayData[] {
  return holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= startDate && holidayDate <= endDate;
  });
}

/**
 * Cache holidays in chrome storage
 * TODO: Implement caching logic
 */
export async function cacheHolidays(holidays: HolidayData[]): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        'gitam_holidays': holidays,
        'gitam_holidays_timestamp': Date.now()
      });
    }
  } catch (error) {
    console.error('Error caching holidays:', error);
  }
}

/**
 * Get cached holidays
 */
export async function getCachedHolidays(): Promise<HolidayData[] | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['gitam_holidays', 'gitam_holidays_timestamp']);
      
      // Check if cache is less than 7 days old
      const cacheAge = Date.now() - (result.gitam_holidays_timestamp || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (result.gitam_holidays && cacheAge < maxAge) {
        return result.gitam_holidays;
      }
    }
  } catch (error) {
    console.error('Error getting cached holidays:', error);
  }
  
  return null;
}

