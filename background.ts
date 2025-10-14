// Background script for GITAM Student Insights v3
// Handles extension lifecycle, data storage, and communication

interface AttendanceData {
  subjects: any[];
  stats: any;
  lastUpdated: number;
}

interface ExtensionSettings {
  autoRefresh: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

class GitamInsightsBackground {
  private attendanceData: AttendanceData | null = null;
  private settings: ExtensionSettings = {
    autoRefresh: true,
    notifications: true,
    theme: 'system'
  };

  constructor() {
    this.init();
  }

  private async init() {
    // Load saved data
    await this.loadData();
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Set up tab update listener
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Set up alarm for auto-refresh
    if (this.settings.autoRefresh) {
      chrome.alarms.create('autoRefresh', { periodInMinutes: 30 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'autoRefresh') {
          this.handleAutoRefresh();
        }
      });
    }

    console.log('GITAM Student Insights v3: Background script initialized');
  }

  private async loadData() {
    try {
      const result = await chrome.storage.local.get(['attendanceData', 'settings']);
      
      if (result.attendanceData) {
        this.attendanceData = result.attendanceData;
      }
      
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private async saveData() {
    try {
      await chrome.storage.local.set({
        attendanceData: this.attendanceData,
        settings: this.settings
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    switch (message.type) {
      case 'GET_ATTENDANCE_DATA':
        sendResponse({ success: true, data: this.attendanceData });
        break;

      case 'SAVE_ATTENDANCE_DATA':
        this.attendanceData = {
          subjects: message.data.subjects,
          stats: message.data.stats,
          lastUpdated: Date.now()
        };
        this.saveData();
        sendResponse({ success: true });
        break;

      case 'GET_SETTINGS':
        sendResponse({ success: true, data: this.settings });
        break;

      case 'UPDATE_SETTINGS':
        this.settings = { ...this.settings, ...message.data };
        this.saveData();
        sendResponse({ success: true });
        break;

      case 'CLEAR_DATA':
        this.attendanceData = null;
        this.saveData();
        sendResponse({ success: true });
        break;

      case 'REFRESH_ATTENDANCE':
        this.refreshAttendanceData(sender.tab?.id);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  private handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    // Only process when page is completely loaded
    if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.includes('gstudent.gitam.edu')) {
        // Notify content script that attendance page is ready
        chrome.tabs.sendMessage(tabId, { type: 'PAGE_READY', pageType: 'attendance' }).catch(() => {
          // Ignore errors if content script isn't ready yet
        });
      } else if (tab.url.includes('login.gitam.edu')) {
        // Notify content script that login page is ready
        chrome.tabs.sendMessage(tabId, { type: 'PAGE_READY', pageType: 'login' }).catch(() => {
          // Ignore errors if content script isn't ready yet
        });
      }
    }
  }

  private async refreshAttendanceData(tabId?: number) {
    if (tabId) {
      try {
        // Send refresh message to content script
        await chrome.tabs.sendMessage(tabId, { type: 'REFRESH_DATA' });
      } catch (error) {
        console.error('Error refreshing attendance data:', error);
      }
    }
  }

  private async handleAutoRefresh() {
    // Get all GITAM portal tabs
    const tabs = await chrome.tabs.query({ url: 'https://gstudent.gitam.edu/*' });
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'AUTO_REFRESH' });
        } catch (error) {
          // Ignore errors for tabs without content script
        }
      }
    }
  }

  // Public methods for external access
  public async getAttendanceData(): Promise<AttendanceData | null> {
    return this.attendanceData;
  }

  public async getSettings(): Promise<ExtensionSettings> {
    return this.settings;
  }

  public async updateSettings(newSettings: Partial<ExtensionSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveData();
  }
}

// Initialize the background service
const backgroundService = new GitamInsightsBackground();

// Export for potential external access
export default backgroundService;
