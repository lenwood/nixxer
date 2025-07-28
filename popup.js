// Enhanced Nixxer Popup Script with Comprehensive Error Handling

// Error handling and retry utilities
class PopupErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.maxErrorsPerType = 3;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
  }

  log(level, message, error = null, context = {}) {
    const errorKey = `${level}:${message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    
    if (count >= this.maxErrorsPerType) {
      return; // Prevent spam
    }
    
    this.errorCounts.set(errorKey, count + 1);
    
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...(error && { error: error.message, stack: error.stack })
    };
    
    switch (level) {
      case 'debug':
        console.debug('Nixxer Popup Debug:', logData);
        break;
      case 'info':
        console.info('Nixxer Popup Info:', logData);
        break;
      case 'warn':
        console.warn('Nixxer Popup Warning:', logData);
        break;
      case 'error':
        console.error('Nixxer Popup Error:', logData);
        this.showUserError(message);
        break;
    }
  }

  showUserError(message) {
    try {
      // Create or update error display
      let errorEl = document.getElementById('popup-error-message');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'popup-error-message';
        errorEl.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          background: #fed7d7;
          color: #742a2a;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 1000;
          border-left: 4px solid #e53e3e;
        `;
        document.body.insertBefore(errorEl, document.body.firstChild);
      }
      
      errorEl.textContent = `Error: ${message}`;
      errorEl.style.display = 'block';
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        if (errorEl && errorEl.parentNode) {
          errorEl.style.display = 'none';
        }
      }, 8000);
      
    } catch (error) {
      console.error('Could not show user error message:', error);
    }
  }

  async withRetry(operation, operationName) {
    const retryKey = operationName;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(retryKey);
      return result;
    } catch (error) {
      this.log('warn', `${operationName} failed (attempt ${attempts + 1})`, error);
      
      if (attempts < this.maxRetries) {
        this.retryAttempts.set(retryKey, attempts + 1);
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, operationName);
      } else {
        this.retryAttempts.delete(retryKey);
        throw error;
      }
    }
  }

  async withTimeout(promise, timeoutMs = 8000, operationName = 'operation') {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }
}

// Data validation utilities
function validateStatsData(stats) {
  if (!stats || typeof stats !== 'object') {
    throw new Error('Invalid stats data: must be an object');
  }
  
  return {
    enabled: Boolean(stats.enabled),
    blockedToday: Math.max(0, parseInt(stats.blockedToday) || 0),
    cookiesDeleted: Math.max(0, parseInt(stats.cookiesDeleted) || 0),
    totalDomains: Math.max(0, parseInt(stats.totalDomains) || 0),
    recentDomains: Array.isArray(stats.recentDomains) ? stats.recentDomains : [],
    settings: stats.settings || {},
    performance: stats.performance || {},
    error: stats.error || null,
    initializationError: stats.initializationError || null
  };
}

function validateDomainData(domain) {
  if (!domain || typeof domain !== 'object') {
    return null;
  }
  
  return {
    domain: String(domain.domain || 'unknown'),
    lastSeen: parseInt(domain.lastSeen) || Date.now(),
    frequency: Math.max(1, parseInt(domain.frequency) || 1),
    types: Array.isArray(domain.types) ? domain.types : ['unknown'],
    hostDomain: domain.hostDomain ? String(domain.hostDomain) : null
  };
}

// Initialize error handler
const errorHandler = new PopupErrorHandler();

class SafeNixxerPopup {
  constructor() {
    this.stats = null;
    this.initialized = false;
    this.initializationError = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    this.init();
  }

  async init() {
    try {
      errorHandler.log('info', 'Initializing popup');
      
      // Check if browser APIs are available
      this.checkBrowserAPIs();
      
      // Load data with retry and timeout
      await this.safeLoadStats();
      await this.safeLoadVersion();
      
      // Setup event listeners with error handling
      this.setupSafeEventListeners();
      
      // Update UI with error handling
      this.safeUpdateUI();
      
      this.initialized = true;
      errorHandler.log('info', 'Popup initialized successfully');
      
    } catch (error) {
      this.initializationError = error;
      errorHandler.log('error', 'Popup initialization failed', error);
      
      // Try to show a basic error state
      this.showErrorState(error.message);
      
      // Attempt limited functionality
      this.setupBasicFunctionality();
    }
  }

  checkBrowserAPIs() {
    const requiredAPIs = ['browser', 'browser.runtime', 'browser.storage'];
    const missingAPIs = [];
    
    try {
      if (typeof browser === 'undefined') {
        missingAPIs.push('browser');
      } else {
        if (!browser.runtime) missingAPIs.push('browser.runtime');
        if (!browser.storage) missingAPIs.push('browser.storage');
      }
      
      if (missingAPIs.length > 0) {
        throw new Error(`Missing browser APIs: ${missingAPIs.join(', ')}`);
      }
      
    } catch (error) {
      errorHandler.log('error', 'Browser API check failed', error);
      throw error;
    }
  }

  async safeLoadStats() {
    try {
      this.stats = await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          const response = await browser.runtime.sendMessage({ type: 'GET_STATS' });
          
          if (response && response.error) {
            throw new Error(response.error);
          }
          
          return validateStatsData(response || {});
        }, 'load_stats'),
        10000,
        'stats loading'
      );
      
      errorHandler.log('info', 'Stats loaded successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to load stats', error);
      
      // Provide fallback stats
      this.stats = {
        enabled: false,
        blockedToday: 0,
        cookiesDeleted: 0,
        totalDomains: 0,
        recentDomains: [],
        error: error.message
      };
    }
  }

  async safeLoadVersion() {
    try {
      const manifest = browser.runtime.getManifest();
      if (manifest && manifest.version) {
        this.safeUpdateElement('version', `v${manifest.version}`);
      } else {
        throw new Error('No version in manifest');
      }
      
    } catch (error) {
      errorHandler.log('warn', 'Failed to load version', error);
      this.safeUpdateElement('version', 'v?.?.?');
    }
  }

  setupSafeEventListeners() {
    try {
      // Toggle button with error handling
      this.safeAddEventListener('toggle-btn', 'click', () => {
        this.safeToggleExtension();
      });

      // Export button and menu with error handling
      this.setupSafeExportHandlers();

      // Options button with error handling
      this.safeAddEventListener('options-btn', 'click', () => {
        this.safeOpenOptions();
      });
      
      errorHandler.log('info', 'Event listeners setup successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to setup event listeners', error);
    }
  }

  setupSafeExportHandlers() {
    try {
      const exportBtn = this.safeGetElement('export-btn');
      const exportMenu = this.safeGetElement('export-menu');
      
      if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
          try {
            e.stopPropagation();
            exportMenu.classList.toggle('show');
          } catch (error) {
            errorHandler.log('warn', 'Error toggling export menu', error);
          }
        });

        // Close export menu when clicking outside
        document.addEventListener('click', () => {
          try {
            exportMenu.classList.remove('show');
          } catch (error) {
            errorHandler.log('warn', 'Error closing export menu', error);
          }
        });

        // Export options with error handling
        const exportOptions = document.querySelectorAll('.export-option');
        exportOptions.forEach(option => {
          try {
            option.addEventListener('click', (e) => {
              try {
                const format = e.target.dataset.format;
                if (format) {
                  this.safeExportBlocklist(format);
                  exportMenu.classList.remove('show');
                } else {
                  throw new Error('No format specified for export option');
                }
              } catch (error) {
                errorHandler.log('error', 'Error handling export option click', error);
              }
            });
          } catch (error) {
            errorHandler.log('warn', 'Error setting up export option listener', error);
          }
        });
      }
      
    } catch (error) {
      errorHandler.log('error', 'Failed to setup export handlers', error);
    }
  }

  safeAddEventListener(elementId, event, handler) {
    try {
      const element = this.safeGetElement(elementId);
      if (element) {
        element.addEventListener(event, (e) => {
          try {
            handler(e);
          } catch (error) {
            errorHandler.log('error', `Error in ${elementId} ${event} handler`, error);
          }
        });
      } else {
        errorHandler.log('warn', `Element ${elementId} not found for event listener`);
      }
    } catch (error) {
      errorHandler.log('error', `Failed to add event listener to ${elementId}`, error);
    }
  }

  safeGetElement(id) {
    try {
      const element = document.getElementById(id);
      if (!element) {
        errorHandler.log('warn', `Element with ID '${id}' not found`);
      }
      return element;
    } catch (error) {
      errorHandler.log('error', `Error getting element ${id}`, error);
      return null;
    }
  }

  safeUpdateElement(id, content, isHTML = false) {
    try {
      const element = this.safeGetElement(id);
      if (element) {
        if (isHTML) {
          element.innerHTML = content;
        } else {
          element.textContent = content;
        }
        return true;
      }
      return false;
    } catch (error) {
      errorHandler.log('warn', `Error updating element ${id}`, error, { content });
      return false;
    }
  }

  safeUpdateUI() {
    try {
      if (!this.stats) {
        this.showErrorState('No data available');
        return;
      }

      // Update status with error handling
      this.updateSafeStatus();

      // Update toggle button with error handling
      this.updateSafeToggleButton();

      // Update statistics with error handling
      this.updateSafeStats();

      // Update recent domains with error handling
      this.updateSafeRecentDomains();

      // Show initialization errors if any
      if (this.stats.initializationError) {
        this.showWarning(`Extension partially functional: ${this.stats.initializationError}`);
      } else if (this.stats.error) {
        this.showWarning(`Data loading error: ${this.stats.error}`);
      }
      
      errorHandler.log('info', 'UI updated successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to update UI', error);
      this.showErrorState('Failed to update interface');
    }
  }

  updateSafeStatus() {
    try {
      const statusEl = this.safeGetElement('status');
      if (statusEl) {
        if (this.stats.enabled) {
          statusEl.textContent = 'Active - Blocking web trackers';
          statusEl.className = 'status enabled';
        } else {
          statusEl.textContent = 'Disabled - web tracking allowed';
          statusEl.className = 'status disabled';
        }
      }
    } catch (error) {
      errorHandler.log('warn', 'Error updating status', error);
    }
  }

  updateSafeToggleButton() {
    try {
      const toggleBtn = this.safeGetElement('toggle-btn');
      if (toggleBtn) {
        if (this.stats.enabled) {
          toggleBtn.textContent = 'Disable';
          toggleBtn.className = 'btn btn-secondary';
        } else {
          toggleBtn.textContent = 'Enable';
          toggleBtn.className = 'btn btn-primary';
        }
      }
    } catch (error) {
      errorHandler.log('warn', 'Error updating toggle button', error);
    }
  }

  updateSafeStats() {
    try {
      const statsEl = this.safeGetElement('stats');
      if (!statsEl) return;
      
      const statsHTML = `
        <div class="stat-item">
          <span class="stat-label">Blocked Today</span>
          <span class="stat-value">${this.stats.blockedToday.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Cookies Deleted</span>
          <span class="stat-value">${this.stats.cookiesDeleted.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Domains Detected</span>
          <span class="stat-value">${this.stats.totalDomains.toLocaleString()}</span>
        </div>
      `;
      
      this.safeUpdateElement('stats', statsHTML, true);
      
    } catch (error) {
      errorHandler.log('error', 'Error updating stats', error);
      this.safeUpdateElement('stats', '<div class="error">Failed to load statistics</div>', true);
    }
  }

  updateSafeRecentDomains() {
    try {
      const recentSection = this.safeGetElement('recent-section');
      const domainList = this.safeGetElement('domain-list');
      
      if (!recentSection || !domainList) return;

      if (!this.stats.recentDomains || this.stats.recentDomains.length === 0) {
        recentSection.style.display = 'none';
        return;
      }

      recentSection.style.display = 'block';

      const domainsHTML = this.stats.recentDomains.map(domainData => {
        try {
          const domain = validateDomainData(domainData);
          if (!domain) return '';
          
          const lastSeen = this.safeFormatTime(domain.lastSeen);
          const types = domain.types.join(', ');
          const trackingType = this.determineSafeTrackingType(domain);
          
          return `
            <div class="domain-item">
              <div class="domain-header">
                <span class="domain-name" title="${this.escapeHtml(domain.domain)}">${this.escapeHtml(domain.domain)}</span>
                <span class="tracking-type ${trackingType.class}">${trackingType.label}</span>
              </div>
              <div class="domain-details">
                <div class="domain-info">
                  <span>${domain.frequency}x</span>
                  <span>${lastSeen}</span>
                </div>
                ${domain.hostDomain ? `<span class="domain-source">Found on: ${this.escapeHtml(domain.hostDomain)}</span>` : ''}
              </div>
            </div>
          `;
        } catch (error) {
          errorHandler.log('warn', 'Error processing domain data', error, { domain: domainData });
          return '';
        }
      }).filter(html => html).join('');

      this.safeUpdateElement('domain-list', domainsHTML || '<div class="no-data">No recent detections</div>', true);
      
    } catch (error) {
      errorHandler.log('error', 'Error updating recent domains', error);
      this.safeUpdateElement('domain-list', '<div class="error">Failed to load recent detections</div>', true);
    }
  }

  determineSafeTrackingType(domain) {
    try {
      const KNOWN_THIRD_PARTY = [
        'google-analytics.com',
        'googletagmanager.com',
        'stats.wp.com',
        'scorecardresearch.com',
        'quantserve.com',
        'doubleclick.net',
        'googlesyndication.com',
        'facebook.com',
        'connect.facebook.net',
        'analytics.twitter.com',
        'platform.twitter.com',
        'hotjar.com',
        'fullstory.com',
        'logrocket.com',
        'mouseflow.com',
        'smartlook.com',
        '2o7.net',
        'omtrdc.net',
        'demdex.net',
        'everesttech.net',
        'analytics.tiktok.com',
        'business-api.tiktok.com'
      ];

      if (!domain || !domain.domain) {
        return { class: 'mixed', label: 'Unknown' };
      }

      const domainName = domain.domain.toLowerCase();
      
      // Check if it's a known third-party tracker
      const isKnownThirdParty = KNOWN_THIRD_PARTY.some(tracker => 
        domainName === tracker || domainName.endsWith('.' + tracker)
      );
      
      if (isKnownThirdParty) {
        return { class: 'third-party', label: '3rd Party' };
      }
      
      // Check if domain matches the host domain (indicating first-party)
      if (domain.hostDomain && domain.domain === domain.hostDomain) {
        return { class: 'first-party', label: '1st Party' };
      }
      
      // Check if domain is different from host domain
      if (domain.hostDomain && domain.domain !== domain.hostDomain) {
        return { class: 'third-party', label: '3rd Party' };
      }
      
      // Mixed or unknown case
      return { class: 'mixed', label: 'Mixed' };
      
    } catch (error) {
      errorHandler.log('warn', 'Error determining tracking type', error, { domain });
      return { class: 'mixed', label: 'Unknown' };
    }
  }

  async safeToggleExtension() {
    try {
      const result = await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          const response = await browser.runtime.sendMessage({ type: 'TOGGLE_ENABLED' });
          
          if (response && response.error) {
            throw new Error(response.error);
          }
          
          return response;
        }, 'toggle_extension'),
        5000,
        'extension toggle'
      );
      
      if (result && typeof result.enabled === 'boolean') {
        this.stats.enabled = result.enabled;
        this.updateSafeStatus();
        this.updateSafeToggleButton();
        
        this.showSuccess(`Extension ${result.enabled ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error('Invalid toggle response');
      }
      
    } catch (error) {
      errorHandler.log('error', 'Failed to toggle extension', error);
      this.showError('Failed to toggle extension. Please try again.');
    }
  }

  async safeExportBlocklist(format) {
    if (!format || typeof format !== 'string') {
      errorHandler.log('error', 'Invalid export format', null, { format });
      this.showError('Invalid export format');
      return;
    }

    const exportBtn = this.safeGetElement('export-btn');
    
    try {
      // Update button state
      if (exportBtn) {
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;
      }

      const result = await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          const response = await browser.runtime.sendMessage({
            type: 'EXPORT_BLOCKLIST',
            format: format
          });
          
          if (response && response.error) {
            throw new Error(response.error);
          }
          
          return response;
        }, 'export_blocklist'),
        15000,
        'blocklist export'
      );

      if (result && result.content && result.filename) {
        this.safeDownloadFile(result.content, result.filename);
        this.showSuccess(`Exported ${format} blocklist successfully`);
      } else {
        throw new Error('Export failed - no data received');
      }
      
    } catch (error) {
      errorHandler.log('error', 'Export failed', error, { format });
      this.showError(`Export failed: ${error.message}`);
    } finally {
      // Reset button state
      if (exportBtn) {
        exportBtn.textContent = 'Export';
        exportBtn.disabled = false;
      }
    }
  }

  safeDownloadFile(content, filename) {
    try {
      if (!content || !filename) {
        throw new Error('Invalid download parameters');
      }
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      errorHandler.log('error', 'Failed to download file', error, { filename });
      throw error;
    }
  }

  async safeOpenOptions() {
    try {
      if (browser.runtime && browser.runtime.openOptionsPage) {
        await browser.runtime.openOptionsPage();
      } else {
        throw new Error('Options page API not available');
      }
    } catch (error) {
      errorHandler.log('error', 'Failed to open options page', error);
      this.showError('Failed to open options page');
    }
  }

  safeFormatTime(timestamp) {
    try {
      if (!timestamp || isNaN(timestamp)) {
        return 'Unknown';
      }
      
      const now = Date.now();
      const diff = now - timestamp;
      
      if (diff < 60000) { // Less than 1 minute
        return 'Just now';
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
      } else {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
      }
      
    } catch (error) {
      errorHandler.log('warn', 'Error formatting time', error, { timestamp });
      return 'Unknown';
    }
  }

  escapeHtml(text) {
    try {
      if (typeof text !== 'string') {
        return String(text || '');
      }
      
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
      
    } catch (error) {
      errorHandler.log('warn', 'Error escaping HTML', error, { text });
      return String(text || '');
    }
  }

  showSuccess(message) {
    try {
      this.showNotification(message, 'success', '#4ade80');
    } catch (error) {
      errorHandler.log('warn', 'Error showing success message', error);
    }
  }

  showError(message) {
    try {
      this.showNotification(message, 'error', '#ef4444');
    } catch (error) {
      errorHandler.log('warn', 'Error showing error message', error);
    }
  }

  showWarning(message) {
    try {
      this.showNotification(message, 'warning', '#f59e0b');
    } catch (error) {
      errorHandler.log('warn', 'Error showing warning message', error);
    }
  }

  showNotification(message, type = 'info', color = '#3b82f6') {
    try {
      // Remove existing notifications
      const existing = document.querySelectorAll('.nixxer-notification');
      existing.forEach(el => {
        try {
          if (el.parentNode) el.parentNode.removeChild(el);
        } catch (error) {
          // Ignore removal errors
        }
      });
      
      const notification = document.createElement('div');
      notification.className = 'nixxer-notification';
      notification.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        max-width: 320px;
        text-align: center;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        try {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        } catch (error) {
          // Ignore removal errors
        }
      }, type === 'error' ? 6000 : 3000);
      
    } catch (error) {
      errorHandler.log('warn', 'Error showing notification', error);
      // Fallback to console
      console.log(`Nixxer ${type}: ${message}`);
    }
  }

  showErrorState(message) {
    try {
      const statsEl = this.safeGetElement('stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="error" style="text-align: center; color: #ef4444; padding: 20px;">
            <div style="font-size: 16px; margin-bottom: 8px;">⚠️ Error</div>
            <div style="font-size: 12px;">${this.escapeHtml(message)}</div>
            <div style="font-size: 11px; margin-top: 8px; opacity: 0.7;">
              Try refreshing or check extension permissions
            </div>
          </div>
        `;
      }
      
      // Hide other sections
      const recentSection = this.safeGetElement('recent-section');
      if (recentSection) {
        recentSection.style.display = 'none';
      }
      
    } catch (error) {
      errorHandler.log('error', 'Error showing error state', error);
    }
  }

  setupBasicFunctionality() {
    try {
      errorHandler.log('info', 'Setting up basic functionality fallback');
      
      // Show minimal error state
      this.showErrorState('Extension initialization failed');
      
      // Disable interactive elements
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        try {
          button.disabled = true;
          button.title = 'Extension not fully functional';
        } catch (error) {
          // Ignore individual button errors
        }
      });
      
      // Show a retry option
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Retry';
      retryButton.className = 'btn btn-primary';
      retryButton.style.margin = '10px';
      
      retryButton.addEventListener('click', () => {
        try {
          window.location.reload();
        } catch (error) {
          errorHandler.log('error', 'Failed to reload popup', error);
        }
      });
      
      const statsEl = this.safeGetElement('stats');
      if (statsEl) {
        statsEl.appendChild(retryButton);
      }
      
    } catch (error) {
      errorHandler.log('error', 'Failed to setup basic functionality', error);
    }
  }
}

// Safe initialization with comprehensive error handling
function safeInitializePopup() {
  try {
    // Check if we're in a valid popup environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      console.error('Not in valid popup environment');
      return;
    }
    
    // Check if required DOM elements exist
    const requiredElements = ['stats', 'toggle-btn', 'export-btn', 'options-btn'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      console.warn('Missing required elements:', missingElements);
      // Continue anyway - the popup will handle missing elements gracefully
    }
    
    // Initialize popup
    new SafeNixxerPopup();
    
  } catch (error) {
    console.error('Critical error initializing popup:', error);
    
    // Last resort error display
    try {
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ef4444;">
          <div style="font-size: 16px; margin-bottom: 10px;">⚠️ Extension Error</div>
          <div style="font-size: 12px; margin-bottom: 10px;">Failed to initialize popup</div>
          <div style="font-size: 11px; opacity: 0.7;">${error.message}</div>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">
            Retry
          </button>
        </div>
      `;
    } catch (displayError) {
      console.error('Could not even show error state:', displayError);
    }
  }
}

// Enhanced initialization with fallbacks
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        safeInitializePopup();
      } catch (error) {
        console.error('Error in DOMContentLoaded handler:', error);
      }
    });
    
    // Fallback timeout
    setTimeout(() => {
      try {
        if (document.readyState !== 'loading') {
          safeInitializePopup();
        }
      } catch (error) {
        console.error('Error in fallback initialization:', error);
      }
    }, 2000);
    
  } else {
    // Document already ready
    safeInitializePopup();
  }
  
} catch (error) {
  console.error('Critical error in popup initialization setup:', error);
  
  // Last resort fallback
  setTimeout(() => {
    try {
      safeInitializePopup();
    } catch (lastResortError) {
      console.error('Complete popup initialization failure:', lastResortError);
    }
  }, 3000);
}

// Global error handlers for the popup
try {
  window.addEventListener('error', (event) => {
    console.error('Unhandled error in popup:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in popup:', event.reason);
  });
} catch (error) {
  console.error('Could not set up global error handlers:', error);
}