import { FeatureFlag, type UserFeaturePreferences } from '@/lib/types';

/**
 * DEVELOPMENT ONLY: Get Pro mode status from storage
 * This is a temporary toggle for development/testing
 */
export async function getDevProMode(): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('gitam_dev_pro_mode');
      return result.gitam_dev_pro_mode === true;
    }
  } catch (error) {
    console.error('Error getting dev pro mode:', error);
  }
  return false;
}

/**
 * DEVELOPMENT ONLY: Set Pro mode status in storage
 */
export async function setDevProMode(enabled: boolean): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ gitam_dev_pro_mode: enabled });
      console.log(`🔧 DEV MODE: Pro features ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
  } catch (error) {
    console.error('Error setting dev pro mode:', error);
  }
}

/**
 * Check if user is a Pro user
 * TODO: Connect to Firebase Authentication and Firestore
 * 
 * CURRENT: Uses development toggle from chrome.storage
 * 
 * In production, this will:
 * 1. Check if user is logged in via Firebase Auth
 * 2. Query Firestore for user's pro status
 * 3. Validate pro subscription expiry date
 * 4. Cache the result locally with TTL
 */
export function isProUser(): boolean {
  // DEVELOPMENT MODE: Check storage synchronously
  // This is a temporary solution. In production, replace with async Firebase check
  
  // For synchronous access in components, we'll use a cached value
  // The cache is updated whenever the popup toggle is changed
  
  // Try to read from sessionStorage as a sync fallback
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem('gitam_dev_pro_mode_cache');
    if (cached !== null) {
      return cached === 'true';
    }
  }
  
  return false; // Default to free tier
}

/**
 * Update the pro mode cache for synchronous access
 * Call this after changing dev pro mode
 */
export async function updateProModeCache(): Promise<void> {
  const isPro = await getDevProMode();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('gitam_dev_pro_mode_cache', isPro.toString());
  }
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(feature: FeatureFlag): boolean {
  const proFeatures = [
    FeatureFlag.ATTENDANCE_CALCULATOR,
    FeatureFlag.ADVANCED_ANALYTICS,
    FeatureFlag.EXPORT_DATA,
  ];
  
  // If it's a pro feature, check pro status
  if (proFeatures.includes(feature)) {
    return isProUser();
  }
  
  // Free features are always accessible
  return true;
}

/**
 * Get user's enabled feature preferences from storage
 */
export async function getEnabledFeatures(): Promise<UserFeaturePreferences> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('gitam_feature_preferences');
      return result.gitam_feature_preferences || {};
    }
  } catch (error) {
    console.error('Error getting feature preferences:', error);
  }
  
  return {};
}

/**
 * Toggle a feature on/off for the user
 */
export async function toggleFeature(
  feature: FeatureFlag,
  enabled: boolean
): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const preferences = await getEnabledFeatures();
      preferences[feature] = enabled;
      
      await chrome.storage.local.set({
        gitam_feature_preferences: preferences,
      });
    }
  } catch (error) {
    console.error('Error toggling feature:', error);
  }
}

/**
 * Check if a specific feature is enabled by the user
 */
export async function isFeatureEnabled(feature: FeatureFlag): Promise<boolean> {
  // First check if user has access to the feature
  if (!hasFeatureAccess(feature)) {
    return false;
  }
  
  // Then check if user has enabled it
  const preferences = await getEnabledFeatures();
  
  // Default to true if not explicitly set
  return preferences[feature] !== false;
}

/**
 * Get list of all features user has access to
 */
export function getAccessibleFeatures(): FeatureFlag[] {
  return Object.values(FeatureFlag).filter(feature => hasFeatureAccess(feature));
}

/**
 * Initialize feature system
 * Sets up default preferences for new users
 */
export async function initializeFeatureSystem(): Promise<void> {
  try {
    const preferences = await getEnabledFeatures();
    
    // If no preferences set, initialize with defaults (all accessible features enabled)
    if (Object.keys(preferences).length === 0) {
      const defaultPreferences: UserFeaturePreferences = {};
      
      Object.values(FeatureFlag).forEach(feature => {
        // Enable all free features by default
        defaultPreferences[feature] = !isProFeature(feature);
      });
      
      await chrome.storage.local.set({
        gitam_feature_preferences: defaultPreferences,
      });
    }
  } catch (error) {
    console.error('Error initializing feature system:', error);
  }
}

/**
 * Check if a feature requires Pro subscription
 */
export function isProFeature(feature: FeatureFlag): boolean {
  const proFeatures = [
    FeatureFlag.ATTENDANCE_CALCULATOR,
    FeatureFlag.ADVANCED_ANALYTICS,
    FeatureFlag.EXPORT_DATA,
  ];
  
  return proFeatures.includes(feature);
}

/**
 * Get user pro status with caching
 * TODO: Implement with Firebase and caching
 */
export async function getProStatusWithCache(): Promise<{
  isPro: boolean;
  expiresAt?: number;
}> {
  // Placeholder
  // TODO: Check cache first, then Firebase if cache expired
  return {
    isPro: false,
  };
}

