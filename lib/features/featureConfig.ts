import { FeatureFlag, type Feature } from '@/lib/types';

/**
 * Configuration for all features in the application
 * Each feature has metadata used for UI display and access control
 */
export const FEATURES: Feature[] = [
  {
    id: FeatureFlag.ATTENDANCE_OVERVIEW,
    name: 'Attendance Overview',
    description: 'View your attendance statistics and charts',
    isPro: false,
    icon: 'BarChart3',
    category: 'attendance',
  },
  {
    id: FeatureFlag.ATTENDANCE_HISTORY,
    name: 'Attendance History',
    description: 'View your complete attendance timeline and records',
    isPro: false,
    icon: 'History',
    category: 'attendance',
  },
  {
    id: FeatureFlag.ATTENDANCE_TRENDS,
    name: 'Attendance Trends',
    description: '5-day attendance prediction with best/worst case scenarios',
    isPro: false,
    icon: 'TrendingUp',
    category: 'attendance',
  },
  {
    id: FeatureFlag.ATTENDANCE_CALCULATOR,
    name: 'Attendance Calculator',
    description: 'Interactive what-if calculator with calendar view and drag-to-fill',
    isPro: true,
    icon: 'Calculator',
    category: 'attendance',
  },
  {
    id: FeatureFlag.ADVANCED_ANALYTICS,
    name: 'Advanced Analytics',
    description: 'Deep insights with ML-powered recommendations',
    isPro: true,
    icon: 'Sparkles',
    category: 'analytics',
  },
  {
    id: FeatureFlag.EXPORT_DATA,
    name: 'Export Data',
    description: 'Export your attendance data as CSV, JSON, or PDF',
    isPro: true,
    icon: 'Download',
    category: 'export',
  },
];

/**
 * Get feature by ID
 */
export function getFeatureById(id: FeatureFlag): Feature | undefined {
  return FEATURES.find(feature => feature.id === id);
}

/**
 * Get all Pro features
 */
export function getProFeatures(): Feature[] {
  return FEATURES.filter(feature => feature.isPro);
}

/**
 * Get all Free features
 */
export function getFreeFeatures(): Feature[] {
  return FEATURES.filter(feature => !feature.isPro);
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(
  category: 'attendance' | 'analytics' | 'export'
): Feature[] {
  return FEATURES.filter(feature => feature.category === category);
}

