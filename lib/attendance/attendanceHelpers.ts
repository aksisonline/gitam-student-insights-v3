import type { SubjectData } from '@/lib/types';

/**
 * Get color class based on attendance percentage
 */
export function getStatusColor(percentage: number): string {
  if (percentage >= 75) return 'text-green-600 dark:text-green-400';
  if (percentage >= 65) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get background color class based on attendance percentage
 */
export function getStatusBgColor(percentage: number): string {
  if (percentage >= 75) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900';
  if (percentage >= 65) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900';
}

/**
 * Get badge variant based on status
 */
export function getStatusBadgeVariant(status: 'safe' | 'warning' | 'risk'): 'default' | 'secondary' | 'destructive' {
  if (status === 'safe') return 'default';
  if (status === 'warning') return 'secondary';
  return 'destructive';
}

/**
 * Format percentage with optional decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Sort subjects by different criteria
 */
export function sortSubjects(
  subjects: SubjectData[],
  sortBy: 'percentage' | 'name' | 'status' = 'percentage',
  order: 'asc' | 'desc' = 'asc'
): SubjectData[] {
  const sorted = [...subjects].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'percentage':
        comparison = a.percentage - b.percentage;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        const statusOrder = { risk: 0, warning: 1, safe: 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Convert percentage to contribution graph level (0-4)
 */
export function getLevelFromPercentage(percentage: number): number {
  if (percentage >= 90) return 4;
  if (percentage >= 80) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 60) return 1;
  return 0;
}

/**
 * Get status based on percentage
 */
export function getAttendanceStatus(percentage: number): 'safe' | 'warning' | 'risk' {
  if (percentage >= 75) return 'safe';
  if (percentage >= 65) return 'warning';
  return 'risk';
}

/**
 * Calculate days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get date range between two dates
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

