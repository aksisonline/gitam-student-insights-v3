import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AttendanceDashboard } from '../components/attendance/AttendanceDashboard';
import { SubjectData, AttendanceStats } from '../lib/types';
import { updateProModeCache } from '../lib/features/featureManager';
import '../globals.css';

// Content script for GITAM attendance page using proven logic from GITAM Pro Max
class GitamInsightsContent {
  private attendanceData: any = {};
  private subjectData: SubjectData[] = [];
  private fullAttendanceRecords: any[] = [];
  private originalOverallPercentage = 0;
  private isGitamPortal = false;
  private attendancePageLoaded = false;
  private isExtractingData = false;
  private isApiDataLoaded = false;
  private hasAccurateSubjectData = false;
  private reactRoot: any = null;

  constructor() {
    this.init();
  }

  async init() {
    // Initialize pro mode cache for sync access
    try {
      await updateProModeCache();
      console.log('GITAM Student Insights v3: Pro mode cache initialized');
    } catch (error) {
      console.error('GITAM Student Insights v3: Error initializing pro mode cache:', error);
    }
    
    // Check if we're on GITAM portal
    this.isGitamPortal = window.location.href.includes('gstudent.gitam.edu');
    
    if (this.isGitamPortal) {
      // Start monitoring for attendance page
      this.startMonitoring();
      // Monitor for dynamic content changes
      this.observeContentChanges();
    }
  }

  startMonitoring() {
    // Check immediately
    this.checkForAttendancePage();
    
    // Check periodically for SPA navigation
    setInterval(() => {
      this.checkForAttendancePage();
    }, 2000);
  }

  observeContentChanges() {
    // Observe changes to the main content div
    const targetNode = document.getElementById('maindiv');
    if (targetNode) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'subtree') {
            // Check if attendance content was loaded
            setTimeout(() => this.checkForAttendancePage(), 1000);
          }
        });
      });
      
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    }
  }

  checkForAttendancePage() {
    const isAttendancePage = this.isAttendancePage();
    
    if (isAttendancePage && !this.attendancePageLoaded) {
      console.log('GITAM Student Insights v3: Attendance page detected!');
      this.attendancePageLoaded = true;
      // Reset extraction flag for new page load
      this.isExtractingData = false;
      this.injectCustomStyles();
      this.setupEnhancedTab();
      this.interceptAPIResponses();
      this.extractExistingData();
    } else if (!isAttendancePage && this.attendancePageLoaded) {
      // User navigated away from attendance page
      this.cleanup();
    }
  }

  cleanup() {
    console.log('GITAM Student Insights v3: Cleaning up...');
    this.attendancePageLoaded = false;
    this.isExtractingData = false;
    this.isApiDataLoaded = false;
    this.hasAccurateSubjectData = false;
    
    // Remove Enhanced View tab if it exists
    const enhancedTab = document.querySelector('#nav-enhanced-tab');
    if (enhancedTab) enhancedTab.parentElement?.remove();
    
    // Remove Enhanced View tab pane if it exists
    const enhancedPane = document.querySelector('#tabEnhanced');
    if (enhancedPane) enhancedPane.remove();
    
    // Remove custom styles
    const styles = document.querySelector('#gitam-enhanced-styles');
    if (styles) styles.remove();
    
    // Clean up React root
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  isAttendancePage() {
    // Check multiple indicators that we're on the attendance page (from GITAM Pro Max)
    return (
      // Check for attendance page title
      document.querySelector('.page-title')?.textContent?.includes('Attendance') ||
      // Check for userId hidden input (contains overall percentage)
      document.getElementById('userId') !== null ||
      // Check for attendance table
      document.querySelector('#myTablevend') !== null ||
      // Check for tab content with attendance data
      document.querySelector('#tab3.active') !== null ||
      // Check for attendance specific elements
      document.querySelector('.tabsContainer') !== null
    );
  }

  injectCustomStyles() {
    // Check if styles already injected
    if (document.querySelector('#gitam-enhanced-styles')) return;
    
    const styleTag = document.createElement('style');
    styleTag.id = 'gitam-enhanced-styles';
    styleTag.textContent = `
      /* Enhanced View tab standout styling */
      #nav-enhanced-tab {
        transition: all 0.2s ease;
      }
      
      #nav-enhanced-tab.active {
        color: #007367 !important;
        border-bottom-color: #007367 !important;
        font-weight: 600;
      }
      
      #nav-enhanced-tab.active span:first-child {
        animation: sparkle 2s ease-in-out infinite;
      }
      
      @keyframes sparkle {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }
      
      /* Dashboard container styling */
      #gitam-enhanced-dashboard-root {
        min-height: 400px;
      }
    `;
    
    document.head.appendChild(styleTag);
  }

  setupEnhancedTab() {
    const navTabs = document.querySelector('.nav.nav-tabs');
    const tabContent = document.querySelector('.tab-content');
    
    if (!navTabs || !tabContent) {
      console.warn('GITAM Student Insights: Could not find tab navigation');
      return;
    }

    // Remove old tab if exists
    const oldTab = document.querySelector('#nav-enhanced-tab');
    const oldPane = document.querySelector('#tabEnhanced');
    if (oldTab) oldTab.parentElement?.remove();
    if (oldPane) oldPane.remove();

    // Create new tab list item
    const tabItem = document.createElement('li');
    tabItem.className = 'nav-item';
    tabItem.setAttribute('role', 'presentation');

    // Create tab link with GITAM theme + standout styling
    const tabLink = document.createElement('a');
    tabLink.id = 'nav-enhanced-tab';
    tabLink.className = 'nav-link';
    tabLink.setAttribute('data-bs-toggle', 'tab');
    tabLink.setAttribute('href', '#tabEnhanced');
    tabLink.setAttribute('role', 'tab');
    tabLink.setAttribute('aria-controls', 'tabEnhanced');
    tabLink.setAttribute('aria-selected', 'false');
    
    // Add icon and text with inline styles for standout effect
    tabLink.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 0.375rem;">
        <span style="font-size: 1.1rem; filter: drop-shadow(0 0 4px rgba(0, 115, 103, 0.3));">✨</span>
        <span>Enhanced View</span>
      </span>
    `;
    
    // Add custom styling to make it stand out while matching theme
    tabLink.style.cssText = `
      position: relative;
      font-weight: 500;
    `;
    
    // Add hover effect that matches GITAM but with teal accent
    tabLink.addEventListener('mouseenter', () => {
      if (!tabLink.classList.contains('active')) {
        tabLink.style.color = '#007367';
        tabLink.style.borderBottomColor = '#007367';
      }
    });
    
    tabLink.addEventListener('mouseleave', () => {
      if (!tabLink.classList.contains('active')) {
        tabLink.style.color = '';
        tabLink.style.borderBottomColor = '';
      }
    });

    // Add click handler
    tabLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showEnhancedView(tabLink);
    });

    tabItem.appendChild(tabLink);
    
    // Insert as last tab (after Semester)
    navTabs.appendChild(tabItem);

    // Create tab pane for enhanced content
    const tabPane = document.createElement('div');
    tabPane.id = 'tabEnhanced';
    tabPane.className = 'tab-pane';
    tabPane.setAttribute('role', 'tabpanel');
    tabPane.setAttribute('aria-labelledby', 'nav-enhanced-tab');
    
    // Add container for React dashboard
    tabPane.innerHTML = `
      <div id="gitam-enhanced-dashboard-root" style="padding: 1rem 0;">
        <!-- React dashboard will mount here -->
      </div>
    `;
    
    tabContent.appendChild(tabPane);
  }

  showEnhancedView(tabLink: HTMLElement) {
    // Deactivate all other tabs
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      link.setAttribute('aria-selected', 'false');
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active', 'show');
    });

    // Activate Enhanced View tab
    tabLink.classList.add('active');
    tabLink.setAttribute('aria-selected', 'true');
    
    const tabPane = document.querySelector('#tabEnhanced');
    if (tabPane) {
      tabPane.classList.add('active', 'show');
    }

    // Ensure we have data before rendering
    if (this.subjectData.length === 0 && !this.hasAccurateSubjectData) {
      console.log('GITAM Student Insights v3: Extracting data from DOM...');
      this.extractSubjectDataFromDOM();
    }

    // If still no data, try API fetch
    if (this.subjectData.length === 0) {
      console.log('GITAM Student Insights v3: No DOM data, fetching from API...');
      this.fetchAndShowEnhancedUI();
    } else {
      // Render immediately with existing data
      this.renderEnhancedDashboard();
      // Refresh in background
      this.refreshAttendanceData();
    }
  }

  showEnhancedUI() {
    const boxContainer = document.querySelector('.box-container');
    if (!boxContainer) return;

    // Save original content if not already saved
    if (this.originalBoxHTML === null) {
      this.originalBoxHTML = boxContainer.innerHTML;
    }

    // First, try to extract data from DOM if not already done
    if (this.subjectData.length === 0 && !this.hasAccurateSubjectData) {
      console.log('GITAM Student Insights v3: Extracting data from DOM before showing enhanced view...');
      this.extractSubjectDataFromDOM();
    }

    // Check if we already have data
    const hasExistingData = this.subjectData.length > 0;

    if (hasExistingData) {
      // We have data, render immediately
      console.log('GITAM Student Insights v3: Using existing data to render enhanced view');
      this.renderEnhancedDashboard();
      
      // Still fetch fresh data in background
      Promise.all([
        this.fetchSubjectOverviewData(),
        this.fetchFullAttendanceData()
      ]).then(() => {
        console.log('GITAM Student Insights v3: Fresh data loaded, re-rendering...');
        const enhancedTab = document.querySelector('#tabEnhanced');
        if (enhancedTab && enhancedTab.classList.contains('active')) {
          this.renderEnhancedDashboard();
        }
      }).catch(error => {
        console.log('GITAM Student Insights v3: Background refresh failed, keeping existing data:', error);
      });
    } else {
      // No existing data, show loading and wait for fetch
      boxContainer.innerHTML = `
        <div style="
          text-align: center; 
          padding: 40px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        ">
          <div style="font-size: 18px; font-weight: 500; color: #374151; margin-bottom: 8px;">
            <span style="font-size: 16px; margin-right: 8px;">⟳</span>Loading attendance data
          </div>
          <div style="font-size: 14px; color: #6b7280;">Fetching your latest attendance records...</div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">This may take a few seconds</div>
        </div>
      `;

      // Retry logic with timeout
      const fetchWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            console.log(`GITAM Student Insights v3: Fetch attempt ${i + 1}/${retries}`);
            
            await Promise.all([
              this.fetchSubjectOverviewData(),
              this.fetchFullAttendanceData()
            ]);
            
            // Also try DOM extraction as fallback
            if (this.subjectData.length === 0) {
              console.log('GITAM Student Insights v3: API fetch returned no data, trying DOM extraction...');
              this.extractSubjectDataFromDOM();
              // Wait a bit for DOM to be ready
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Check if we got data
            if (this.subjectData.length > 0) {
              console.log(`GITAM Student Insights v3: Data loaded successfully on attempt ${i + 1}`);
              break;
            } else if (i < retries - 1) {
              console.log(`GITAM Student Insights v3: No data yet, retrying in ${(i + 1) * 1000}ms...`);
              await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
            }
          } catch (error) {
            console.log(`GITAM Student Insights v3: Fetch attempt ${i + 1} failed:`, error);
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
            }
          }
        }
      };

      fetchWithRetry().then(() => {
        this.renderEnhancedDashboard();
      }).catch(error => {
        console.log('GITAM Student Insights v3: All fetch attempts failed:', error);
        this.renderEnhancedDashboard(); // Render anyway, will show empty state
      });
    }
  }

  renderEnhancedDashboard() {
    const dashboardRoot = document.querySelector('#gitam-enhanced-dashboard-root');
    if (!dashboardRoot) {
      console.error('GITAM Student Insights v3: Dashboard root not found');
      return;
    }

    // Show loading if no data yet
    if (this.subjectData.length === 0) {
      dashboardRoot.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">⟳</div>
          <div style="font-size: 1.125rem; font-weight: 500; color: #374151;">Loading attendance data...</div>
          <div style="font-size: 0.875rem; margin-top: 0.5rem;">Fetching from GITAM servers</div>
        </div>
      `;
      return;
    }

    // Calculate stats
    const stats = this.calculateStats(this.subjectData);

    // Render React app with error handling
    try {
      console.log('GITAM Student Insights v3: Rendering AttendanceDashboard in tab with:', {
        subjects: this.subjectData,
        stats: stats,
      });
      
      // Check if AttendanceDashboard is properly imported
      if (!AttendanceDashboard) {
        throw new Error('AttendanceDashboard component is undefined');
      }
      
      // Unmount previous root if exists
      if (this.reactRoot) {
        this.reactRoot.unmount();
      }
      
      this.reactRoot = createRoot(dashboardRoot);
      this.reactRoot.render(
        <AttendanceDashboard
          subjects={this.subjectData}
          stats={stats}
          loading={false}
          error={null}
          onRefresh={() => this.refreshAttendanceData()}
        />
      );
      
      console.log('GITAM Student Insights v3: Enhanced dashboard rendered successfully');
    } catch (error) {
      console.error('GITAM Student Insights v3: Error rendering React component:', error);
      // Fallback to simple HTML if React fails
      reactContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
          <h3 style="color: #374151; margin-bottom: 8px;">Attendance Dashboard</h3>
          <p style="color: #6b7280; margin-bottom: 16px;">Loading attendance data...</p>
          <button onclick="location.reload()" style="
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            cursor: pointer;
          ">Refresh</button>
        </div>
      `;
    }
  }

  calculateStats(subjects?: SubjectData[]): AttendanceStats {
    // Ensure subjectData is an array
    const subjectsToUse = subjects || (Array.isArray(this.subjectData) ? this.subjectData : []);
    
    const totalSubjects = subjectsToUse.length;
    const safeSubjects = subjectsToUse.filter(s => s && s.status === 'safe').length;
    const warningSubjects = subjectsToUse.filter(s => s && s.status === 'warning').length;
    const riskSubjects = subjectsToUse.filter(s => s && s.status === 'risk').length;
    
    const totalPresent = subjectsToUse.reduce((sum, s) => sum + (s?.present || 0), 0);
    const totalAbsent = subjectsToUse.reduce((sum, s) => sum + (s?.absent || 0), 0);
    const totalClasses = totalPresent + totalAbsent;

    return {
      overallPercentage: this.originalOverallPercentage || 0,
      totalSubjects,
      safeSubjects,
      warningSubjects,
      riskSubjects,
      totalPresent,
      totalAbsent,
      totalClasses
    };
  }

  extractExistingData() {
    console.log('GITAM Student Insights v3: Extracting attendance data...');
    
    // Extract overall percentage from hidden input
    const userIdInput = document.getElementById('userId');
    if (userIdInput) {
      this.originalOverallPercentage = parseFloat(userIdInput.value) || 0;
      console.log('Overall percentage found:', this.originalOverallPercentage);
    }

    // Extract subject data from the DOM first (fallback)
    this.extractSubjectDataFromDOM();
    
    // Then try to fetch more accurate data from API
    this.fetchSubjectOverviewData().catch(error => {
      console.log('GITAM Student Insights v3: API fetch failed, using DOM data:', error);
    });
    
    // Monitor AJAX calls for dynamic data updates
    this.monitorAjaxCalls();
  }

  extractSubjectDataFromDOM() {
    // Only clear and extract from DOM if we don't have accurate API data
    if (this.hasAccurateSubjectData) {
      console.log('GITAM Student Insights v3: Skipping DOM extraction, keeping accurate API subject data');
      return;
    }
    
    // Clear existing data
    this.subjectData = [];
    
    // Look for the main attendance table (myTablevend)
    const attendanceTable = document.getElementById('myTablevend');
    
    if (attendanceTable) {
      console.log('GITAM Student Insights v3: Found attendance table');
      
      const rows = attendanceTable.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        
        if (cells.length >= 3) {
          const code = cells[0]?.textContent?.trim();
          const name = cells[1]?.textContent?.trim();
          
          // Extract percentage from the progress element and span
          const percentageSpan = cells[2]?.querySelector('span');
          const percentageText = percentageSpan?.textContent?.trim();
          
          if (code && name && percentageText) {
            const percentage = parseFloat(percentageText.replace('%', ''));
            if (!isNaN(percentage)) {
              const subject: SubjectData = {
                code,
                name,
                percentage,
                status: this.getAttendanceStatus(percentage),
                present: Math.round((percentage / 100) * 100), // Simplified calculation
                total: 100, // Simplified - you'll need actual data
                absent: 100 - Math.round((percentage / 100) * 100)
              };
              
              this.subjectData.push(subject);
              console.log('Subject extracted:', subject);
            }
          }
        }
      });
    } else {
      console.log('GITAM Student Insights v3: Attendance table not found, waiting for data to load...');
    }
    
    console.log('Total subjects extracted:', this.subjectData.length);
    
    // Only retry DOM extraction if we don't have API data and we're on an attendance page
    if (this.subjectData.length === 0 && !this.isApiDataLoaded && !this.isExtractingData) {
      this.isExtractingData = true;
      setTimeout(() => {
        this.isExtractingData = false;
        if (this.attendancePageLoaded && this.subjectData.length === 0 && !this.isApiDataLoaded) {
          this.extractSubjectDataFromDOM();
          const enhancedTab = document.querySelector('#tabEnhanced');
          if (enhancedTab && enhancedTab.classList.contains('active')) {
            this.renderEnhancedDashboard();
          }
        }
      }, 2000);
    }
  }

  getAttendanceStatus(percentage: number): 'safe' | 'warning' | 'risk' {
    if (percentage < 65) return 'risk';
    if (percentage < 75) return 'warning';
    return 'safe';
  }

  interceptAPIResponses() {
    console.log('GITAM Student Insights v3: Setting up API interception...');
    
    // Store reference to this for closure
    const self = this;
    
    // Intercept fetch requests
    if (!window._gitamOriginalFetch) {
      window._gitamOriginalFetch = window.fetch;
      window.fetch = async function(...args) {
        const response = await window._gitamOriginalFetch(...args);
        self.handleAPIResponse(args[0], response.clone());
        return response;
      };
    }

    // Intercept XMLHttpRequest
    if (!window._gitamOriginalXHR) {
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._gitamUrl = url;
        this._gitamMethod = method;
        return originalXHROpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('load', function() {
          if (this._gitamUrl && this.status === 200) {
            self.handleAPIResponse(this._gitamUrl, this.responseText);
          }
        });
        return originalXHRSend.call(this, ...args);
      };
      
      window._gitamOriginalXHR = true;
    }
  }

  monitorAjaxCalls() {
    // Monitor jQuery AJAX calls if available
    if (window.$ && !window._gitamJQueryHooked) {
      const self = this;
      
      // Hook into jQuery's global AJAX events
      $(document).ajaxComplete(function(event, xhr, settings) {
        if (settings.url && (settings.url.includes('GetAttendance') || settings.url.includes('GetEvent'))) {
          console.log('GITAM Student Insights v3: AJAX call detected:', settings.url);
          self.handleAPIResponse(settings.url, xhr.responseText);
        }
      });
      
      window._gitamJQueryHooked = true;
    }
  }

  async handleAPIResponse(url: any, response: any) {
    try {
      let responseText = response;
      
      // Handle Response object from fetch
      if (response && typeof response.text === 'function') {
        responseText = await response.text();
      }
      
      const urlString = typeof url === 'string' ? url : url.toString();
      console.log('GITAM Student Insights v3: Processing API response for:', urlString);
      
      if (urlString.includes('GetAttendancedatachart')) {
        console.log('Processing subject data chart...');
        this.parseSubjectDataFromHTML(responseText);
      } else if (urlString.includes('GetAttendancedata')) {
        console.log('Processing attendance data...');
        this.parseAttendanceData(responseText);
      }
    } catch (error) {
      console.log('GITAM Student Insights v3: Error parsing API response:', error);
    }
  }

  parseSubjectDataFromHTML(html: string) {
    // Parse HTML response to extract subject data
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for table rows with subject data
    const rows = doc.querySelectorAll('tr');
    const subjects: SubjectData[] = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const code = cells[0]?.textContent?.trim();
        const name = cells[1]?.textContent?.trim();
        const percentageText = cells[2]?.textContent?.trim();
        
        if (code && name && percentageText) {
          const percentage = parseFloat(percentageText.replace('%', ''));
          if (!isNaN(percentage)) {
            subjects.push({
              code,
              name,
              percentage,
              status: this.getAttendanceStatus(percentage),
              present: Math.round((percentage / 100) * 100),
              total: 100,
              absent: 100 - Math.round((percentage / 100) * 100)
            });
          }
        }
      }
    });
    
    if (subjects.length > 0) {
      this.subjectData = subjects;
      this.hasAccurateSubjectData = true;
      this.isApiDataLoaded = true;
      console.log('GITAM Student Insights v3: Updated subject data from API:', subjects);
      
      // Update UI if enhanced tab is active
      const enhancedTab = document.querySelector('#tabEnhanced');
      if (enhancedTab && enhancedTab.classList.contains('active')) {
        this.renderEnhancedDashboard();
      }
    }
  }

  parseAttendanceData(html: string) {
    // Parse attendance data from HTML response
    console.log('GITAM Student Insights v3: Parsing attendance data...');
    // Implementation similar to GITAM Pro Max
  }

  async fetchSubjectOverviewData() {
    try {
      const apiUrl = 'https://gstudent.gitam.edu/Home/GetAttendancedatachart';
      console.log('GITAM Student Insights v3: Fetching subject overview data from:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const html = await response.text();
        this.parseSubjectDataFromHTML(html);
      }
    } catch (error) {
      console.log('GITAM Student Insights v3: Error fetching subject overview data:', error);
    }
  }

  async fetchFullAttendanceData() {
    try {
      // Calculate date range (last 6 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      
      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };
      
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);
      const dateRange = `${startDateStr}%20to%20${endDateStr}`;
      
      const apiUrl = `https://gstudent.gitam.edu/Home/GetAttendancedata?category=Custom%20Range&date=${dateRange}`;
      
      console.log('GITAM Student Insights v3: Fetching full attendance data from:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const html = await response.text();
        this.parseAttendanceData(html);
      }
    } catch (error) {
      console.log('GITAM Student Insights v3: Error fetching full attendance data:', error);
    }
  }

  async refreshAttendanceData() {
    try {
      // Fetch fresh subject overview data
      await this.fetchSubjectOverviewData();
      
      // Also fetch detailed attendance data if needed
      await this.fetchFullAttendanceData();
      
      // Update the UI if enhanced tab is active
      const enhancedTab = document.querySelector('#tabEnhanced');
      if (enhancedTab && enhancedTab.classList.contains('active')) {
        this.renderEnhancedDashboard();
      }
    } catch (error) {
      console.log('GITAM Student Insights v3: Error refreshing data:', error);
    }
  }
}

// Initialize the content script
function initGitamInsights() {
  if (window.location.href.includes('gstudent.gitam.edu')) {
    new GitamInsightsContent();
  }
}

// Start the content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGitamInsights);
} else {
  initGitamInsights();
}

// Plasmo content script configuration
export const config = {
  matches: ["https://gstudent.gitam.edu/*"],
  run_at: "document_end"
};