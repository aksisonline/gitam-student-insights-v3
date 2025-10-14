import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AttendanceDashboard } from '@/components/attendance/AttendanceDashboard';
import { SubjectData, AttendanceStats } from '@/lib/types';
import '@/globals.css';

// Content script for GITAM attendance page using proven logic from GITAM Pro Max
class GitamInsightsContent {
  private originalBoxHTML: string | null = null;
  private isEnhancedMode = false;
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

  init() {
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
      this.setupUIToggle();
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
    this.isEnhancedMode = false;
    this.isExtractingData = false;
    this.isApiDataLoaded = false;
    this.hasAccurateSubjectData = false;
    
    // Remove toggle and refresh buttons if they exist
    const buttonContainer = document.querySelector('.gitam-button-container');
    if (buttonContainer) buttonContainer.remove();
    
    // Remove enhanced UI if it exists
    const enhancedUI = document.getElementById('gitam-enhanced-ui');
    if (enhancedUI) enhancedUI.remove();
    
    // Clean up React root
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
    
    // Remove enhanced mode class
    document.body.classList.remove('gitam-enhanced-mode');
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

  setupUIToggle() {
    // Place the toggle button inside the main content area, top-right of attendance card
    const boxContainer = document.querySelector('.box-container');
    // Remove old buttons if they exist
    const oldBtn = document.querySelector('.ui-toggle');
    if (oldBtn) oldBtn.remove();

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'gitam-button-container';
    buttonContainer.style.cssText = 'display: flex; gap: 0.5rem; margin: 1rem 0;';

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'ui-toggle';
    toggleBtn.style.cssText = `
      position: static; 
      z-index: 1000;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #ffffff;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 8px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    `;
    toggleBtn.innerHTML = '<span style="font-size: 11px;">⚡</span> Enhanced View';
    toggleBtn.onmouseover = () => {
      toggleBtn.style.background = 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)';
      toggleBtn.style.transform = 'translateY(-1px)';
    };
    toggleBtn.onmouseout = () => {
      toggleBtn.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
      toggleBtn.style.transform = 'translateY(0)';
    };
    toggleBtn.onclick = () => this.toggleEnhancedMode();

    buttonContainer.appendChild(toggleBtn);

    // Place button container just before box-container
    if (boxContainer && boxContainer.parentNode) {
      boxContainer.parentNode.insertBefore(buttonContainer, boxContainer);
    } else {
      document.body.insertBefore(buttonContainer, document.body.firstChild);
    }
  }

  toggleEnhancedMode() {
    this.isEnhancedMode = !this.isEnhancedMode;
    const toggleBtn = document.querySelector('.ui-toggle');
    
    if (this.isEnhancedMode) {
      // Show enhanced UI and fetch data
      toggleBtn.innerHTML = '<span style="font-size: 11px;">↩</span> Original View';
      this.showEnhancedUI();
    } else {
      // Hide enhanced UI
      toggleBtn.innerHTML = '<span style="font-size: 11px;">⚡</span> Enhanced View';
      this.hideEnhancedUI();
    }
  }

  showEnhancedUI() {
    const boxContainer = document.querySelector('.box-container');
    if (!boxContainer) return;

    // Save original content if not already saved
    if (this.originalBoxHTML === null) {
      this.originalBoxHTML = boxContainer.innerHTML;
    }

    // Show loading state
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
        <div style="font-size: 14px; color: #6b7280;">Fetching your latest attendance records</div>
      </div>
    `;

    // Fetch real attendance data from the API, then render UI
    Promise.all([
      this.fetchSubjectOverviewData(),
      this.fetchFullAttendanceData()
    ]).then(() => {
      this.renderEnhancedUI();
    }).catch(error => {
      console.log('GITAM Student Insights v3: Error loading data:', error);
      // Show error state or fallback to existing data
      this.renderEnhancedUI();
    });
  }

  renderEnhancedUI() {
    const boxContainer = document.querySelector('.box-container');
    if (!boxContainer) return;

    // Create container for React app
    const reactContainer = document.createElement('div');
    reactContainer.id = 'gitam-enhanced-ui';
    boxContainer.innerHTML = '';
    boxContainer.appendChild(reactContainer);

    // Calculate stats
    const stats = this.calculateStats();

    // Render React app
    this.reactRoot = createRoot(reactContainer);
    this.reactRoot.render(
      <AttendanceDashboard
        subjects={this.subjectData}
        stats={stats}
        loading={false}
        error={null}
        onRefresh={() => this.refreshAttendanceData()}
      />
    );
  }

  hideEnhancedUI() {
    const boxContainer = document.querySelector('.box-container');
    if (boxContainer && this.originalBoxHTML) {
      boxContainer.innerHTML = this.originalBoxHTML;
    }
    
    // Clean up React root
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  calculateStats(): AttendanceStats {
    const totalSubjects = this.subjectData.length;
    const safeSubjects = this.subjectData.filter(s => s.status === 'safe').length;
    const warningSubjects = this.subjectData.filter(s => s.status === 'warning').length;
    const riskSubjects = this.subjectData.filter(s => s.status === 'risk').length;
    
    const totalPresent = this.subjectData.reduce((sum, s) => sum + (s.present || 0), 0);
    const totalAbsent = this.subjectData.reduce((sum, s) => sum + (s.absent || 0), 0);
    const totalClasses = totalPresent + totalAbsent;

    return {
      overallPercentage: this.originalOverallPercentage,
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
          if (this.isEnhancedMode) {
            this.renderEnhancedUI();
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
      
      // Update UI if in enhanced mode
      if (this.isEnhancedMode) {
        this.renderEnhancedUI();
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
      
      // Update the UI if we're in enhanced mode
      if (this.isEnhancedMode) {
        this.renderEnhancedUI();
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