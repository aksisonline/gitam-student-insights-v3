import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import '@/globals.css';

// CAPTCHA Auto-fill for GITAM login page using proven logic from GITAM Pro Max
class CaptchaAutoFill {
  private isLoginPage = false;
  private reactRoot: any = null;

  constructor() {
    this.init();
  }

  init() {
    // Check if we're on the login page
    this.isLoginPage = (
      window.location.hostname === 'login.gitam.edu' &&
      (
        window.location.pathname === '/' ||
        window.location.pathname.toLowerCase().includes('login')
      )
    );

    if (this.isLoginPage) {
      console.log('GITAM Student Insights v3: Login page detected, initializing CAPTCHA auto-fill...');
      this.initLoginPageFeatures();
    }
  }

  initLoginPageFeatures() {
    console.log('GITAM Student Insights v3: Initializing login page features...');
    
    // Wait for page to fully load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupCaptchaAutoFill();
      });
    } else {
      this.setupCaptchaAutoFill();
    }
    
    // Also monitor for dynamic changes on login page
    this.observeLoginPageChanges();
  }

  setupCaptchaAutoFill() {
    console.log('GITAM Student Insights v3: Setting up CAPTCHA auto-fill...');
    
    // Look for CAPTCHA elements
    const captchaPreview = document.querySelector('.preview');
    const captchaInput = document.getElementById('captcha_form');
    
    if (captchaPreview && captchaInput) {
      console.log('GITAM Student Insights v3: CAPTCHA elements found, extracting text...');
      this.extractAndFillCaptcha(captchaPreview, captchaInput);
      
      // Monitor for CAPTCHA refresh
      this.observeCaptchaChanges(captchaPreview, captchaInput);
      
      // Show UI indicator
      this.showCaptchaUI();
    } else {
      console.log('GITAM Student Insights v3: CAPTCHA elements not found yet, retrying...');
      // Retry after a short delay
      setTimeout(() => this.setupCaptchaAutoFill(), 1000);
    }
  }

  extractAndFillCaptcha(previewElement: Element, inputElement: HTMLInputElement) {
    try {
      // Extract text from all span elements in the preview
      const spans = previewElement.querySelectorAll('span');
      let captchaText = '';
      
      // Create array of span elements with their positions for proper ordering
      const spanData = Array.from(spans).map(span => ({
        element: span,
        text: span.textContent?.trim() || '',
        left: parseFloat((span as HTMLElement).style.left) || 0
      }));
      
      // Sort by left position to get correct order
      spanData.sort((a, b) => a.left - b.left);
      
      // Concatenate the text in correct order
      captchaText = spanData.map(item => item.text).join('');
      
      console.log('GITAM Student Insights v3: Extracted CAPTCHA text:', captchaText);
      
      if (captchaText && captchaText.length > 0) {
        // Fill the input field
        inputElement.value = captchaText;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Add visual indicator
        this.addCaptchaIndicator(inputElement);
        
        console.log('GITAM Student Insights v3: CAPTCHA auto-filled successfully!');
      } else {
        console.log('GITAM Student Insights v3: No CAPTCHA text extracted');
      }
    } catch (error) {
      console.error('GITAM Student Insights v3: Error extracting CAPTCHA:', error);
    }
  }

  addCaptchaIndicator(inputElement: HTMLInputElement) {
    // Add a visual indicator that CAPTCHA was auto-filled
    inputElement.style.borderColor = '#10b981';
    inputElement.style.backgroundColor = '#f0fdf4';
    
    // Remove indicator after 3 seconds
    setTimeout(() => {
      inputElement.style.borderColor = '';
      inputElement.style.backgroundColor = '';
    }, 3000);
  }

  observeLoginPageChanges() {
    // Monitor for dynamic changes on login page
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if CAPTCHA elements were added
          const captchaPreview = document.querySelector('.preview');
          const captchaInput = document.getElementById('captcha_form');
          
          if (captchaPreview && captchaInput) {
            // CAPTCHA elements appeared, set up auto-fill
            setTimeout(() => {
              this.setupCaptchaAutoFill();
            }, 500);
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }

  observeCaptchaChanges(previewElement: Element, inputElement: HTMLInputElement) {
    // Observe changes specifically to the CAPTCHA preview
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || 
          (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
          // CAPTCHA content changed, re-extract
          console.log('GITAM Student Insights v3: CAPTCHA changed, re-extracting...');
          setTimeout(() => {
            this.extractAndFillCaptcha(previewElement, inputElement);
          }, 300);
        }
      });
    });
    
    observer.observe(previewElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }

}

// Initialize CAPTCHA auto-fill
function initCaptchaAutoFill() {
  if (window.location.hostname.includes('login.gitam.edu')) {
    new CaptchaAutoFill();
  }
}

// Start the CAPTCHA auto-fill
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaptchaAutoFill);
} else {
  initCaptchaAutoFill();
}