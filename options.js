// Enhanced Nixxer Options Script with Safe DOM Manipulation

// Advanced error handling and recovery system
class OptionsErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.maxErrorsPerType = 5;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.criticalErrors = [];
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
        console.debug('Nixxer Options Debug:', logData);
        break;
      case 'info':
        console.info('Nixxer Options Info:', logData);
        break;
      case 'warn':
        console.warn('Nixxer Options Warning:', logData);
        break;
      case 'error':
        console.error('Nixxer Options Error:', logData);
        this.criticalErrors.push(logData);
        break;
    }
  }

  async withRetry(operation, operationName, customRetries = null) {
    const maxRetries = customRetries || this.maxRetries;
    const retryKey = operationName;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    try {
      const result = await operation();
      this.retryAttempts.delete(retryKey);
      return result;
    } catch (error) {
      this.log('warn', `${operationName} failed (attempt ${attempts + 1})`, error);
      
      if (attempts < maxRetries) {
        this.retryAttempts.set(retryKey, attempts + 1);
        const delay = Math.min(1000 * Math.pow(2, attempts), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, operationName, customRetries);
      } else {
        this.retryAttempts.delete(retryKey);
        throw error;
      }
    }
  }

  async withTimeout(promise, timeoutMs = 10000, operationName = 'operation') {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  getCriticalErrors() {
    return this.criticalErrors.slice(-10); // Return last 10 critical errors
  }
}

// Safe DOM manipulation utilities
class OptionsDOMHelper {
  static createTextElement(tag, text, className = null) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    return element;
  }

  static createTableRow(cells) {
    const row = document.createElement('tr');
    cells.forEach(cellData => {
      const cell = document.createElement('td');
      if (typeof cellData === 'string') {
        cell.textContent = cellData;
      } else if (cellData.text) {
        cell.textContent = cellData.text;
        if (cellData.title) {
          cell.title = cellData.title;
        }
        if (cellData.style) {
          cell.style.cssText = cellData.style;
        }
      }
      row.appendChild(cell);
    });
    return row;
  }

  static createErrorPage(message, details = null) {
    const container = document.createElement('div');
    container.className = 'container';

    const header = document.createElement('div');
    header.className = 'header';
    
    const title = this.createTextElement('h1', 'Nixxer Settings');
    const errorSubtitle = this.createTextElement('p', '⚠️ Extension Error');
    errorSubtitle.style.color = '#ef4444';
    
    header.appendChild(title);
    header.appendChild(errorSubtitle);

    const errorSection = document.createElement('div');
    errorSection.className = 'section';
    
    const errorTitle = this.createTextElement('h2', 'Error', 'section-title');
    const errorMessage = this.createTextElement('p', `The options page failed to initialize properly: ${message}`);
    errorMessage.style.cssText = 'color: #ef4444; margin-bottom: 20px;';
    
    const errorList = document.createElement('ul');
    errorList.style.cssText = 'color: #6b7280; margin-bottom: 20px;';
    
    const errorReasons = [
      'Extension permissions issues',
      'Storage access problems', 
      'Browser compatibility issues',
      'Corrupted extension data'
    ];
    
    errorReasons.forEach(reason => {
      const listItem = this.createTextElement('li', reason);
      errorList.appendChild(listItem);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry Initialization';
    retryButton.className = 'btn btn-primary';
    retryButton.onclick = () => window.location.reload();
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Extension Data';
    resetButton.className = 'btn btn-danger';
    resetButton.style.marginLeft = '10px';
    resetButton.onclick = async () => {
      try {
        if (confirm('This will reset all extension data and reload the page. Continue?')) {
          await browser.storage.local.clear();
          window.location.reload();
        }
      } catch (error) {
        alert('Failed to clear storage data: ' + error.message);
      }
    };
    
    buttonContainer.appendChild(retryButton);
    buttonContainer.appendChild(resetButton);
    
    errorSection.appendChild(errorTitle);
    errorSection.appendChild(errorMessage);
    errorSection.appendChild(errorList);
    errorSection.appendChild(buttonContainer);

    if (details) {
      const detailsSection = document.createElement('div');
      detailsSection.className = 'section';
      
      const detailsTitle = this.createTextElement('h2', 'Error Details', 'section-title');
      const detailsContent = document.createElement('div');
      detailsContent.style.cssText = 'background: #f7fafc; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;';
      
      details.forEach(detail => {
        const detailDiv = document.createElement('div');
        detailDiv.style.cssText = 'margin-bottom: 10px; padding: 5px; border-left: 3px solid #ef4444;';
        
        const timestamp = this.createTextElement('strong', detail.timestamp);
        const message = this.createTextElement('span', `: ${detail.message}`);
        
        detailDiv.appendChild(timestamp);
        detailDiv.appendChild(message);
        
        if (detail.error) {
          const errorDetail = this.createTextElement('div', detail.error);
          errorDetail.style.color = '#6b7280';
          detailDiv.appendChild(document.createElement('br'));
          detailDiv.appendChild(errorDetail);
        }
        
        detailsContent.appendChild(detailDiv);
      });
      
      detailsSection.appendChild(detailsTitle);
      detailsSection.appendChild(detailsContent);
      container.appendChild(detailsSection);
    }

    container.appendChild(header);
    container.appendChild(errorSection);
    
    return container;
  }

  static clearAndAppendChildren(parent, children) {
    // Clear existing content
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    
    // Append new children
    children.forEach(child => {
      if (child) {
        parent.appendChild(child);
      }
    });
  }
}

// Data validation and sanitization utilities
class DataValidator {
  static validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings must be an object');
    }
    
    const validated = {};
    
    // Validate detection sensitivity
    if (settings.detectionSensitivity !== undefined) {
      const validSensitivities = ['low', 'medium', 'high'];
      if (validSensitivities.includes(settings.detectionSensitivity)) {
        validated.detectionSensitivity = settings.detectionSensitivity;
      } else {
        throw new Error(`Invalid detection sensitivity: ${settings.detectionSensitivity}`);
      }
    }
    
    // Validate numeric settings
    if (settings.maxHostsEntries !== undefined) {
      const max = parseInt(settings.maxHostsEntries);
      if (isNaN(max) || max < 50 || max > 10000) {
        throw new Error('maxHostsEntries must be between 50 and 10000');
      }
      validated.maxHostsEntries = max;
    }
    
    if (settings.autoExportThreshold !== undefined) {
      const threshold = parseInt(settings.autoExportThreshold);
      if (isNaN(threshold) || threshold < 10) {
        throw new Error('autoExportThreshold must be at least 10');
      }
      validated.autoExportThreshold = threshold;
    }
    
    // Validate export format
    if (settings.exportFormat !== undefined) {
      const validFormats = ['pihole', 'nextdns', 'hosts', 'adguard'];
      if (validFormats.includes(settings.exportFormat)) {
        validated.exportFormat = settings.exportFormat;
      } else {
        throw new Error(`Invalid export format: ${settings.exportFormat}`);
      }
    }
    
    // Validate boolean settings
    ['blockSelfHosted', 'debugLogging', 'deleteZombieCookies', 'autoCleanup'].forEach(key => {
      if (settings[key] !== undefined) {
        validated[key] = Boolean(settings[key]);
      }
    });
    
    return validated;
  }

  static validateDomainData(domains) {
    if (!Array.isArray(domains)) {
      throw new Error('Domains must be an array');
    }
    
    return domains.filter(domain => {
      try {
        return domain && 
               typeof domain.domain === 'string' && 
               domain.domain.length > 0 &&
               domain.domain.length < 254 &&
               typeof domain.firstSeen === 'number' &&
               typeof domain.lastSeen === 'number' &&
               typeof domain.frequency === 'number';
      } catch (error) {
        console.warn('Invalid domain data:', domain, error);
        return false;
      }
    });
  }

  static validateImportData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data format');
    }
    
    if (!data.settings || typeof data.settings !== 'object') {
      throw new Error('Import data must contain settings');
    }
    
    if (!Array.isArray(data.domains)) {
      throw new Error('Import data must contain domains array');
    }
    
    // Validate settings
    const validatedSettings = this.validateSettings(data.settings);
    
    // Validate domains
    const validatedDomains = this.validateDomainData(data.domains);
    
    return {
      settings: validatedSettings,
      domains: validatedDomains,
      statistics: data.statistics || {},
      version: data.version || 'unknown',
      exportedAt: data.exportedAt || null
    };
  }

  static sanitizeText(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }
    
    // Simple text sanitization - remove any potentially harmful characters
    return text.replace(/[<>&"']/g, char => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return char;
      }
    });
  }
}

// Initialize error handler
const errorHandler = new OptionsErrorHandler();

class SafeNixxerOptions {
  constructor() {
    this.settings = {
      detectionSensitivity: 'high',
      blockSelfHosted: true,
      debugLogging: false,
      deleteZombieCookies: true,
      maxHostsEntries: 500,
      autoExportThreshold: 450,
      autoCleanup: true,
      exportFormat: 'pihole'
    };
    
    this.domains = [];
    this.statistics = {};
    this.initialized = false;
    this.saveInProgress = false;
    
    this.init();
  }

  async init() {
    try {
      errorHandler.log('info', 'Initializing options page');
      
      // Check browser APIs availability
      this.checkBrowserAPIs();
      
      // Load data with error handling
      await this.safeLoadData();
      await this.safeLoadVersion();
      
      // Setup UI with error handling
      this.setupSafeEventListeners();
      this.safeUpdateUI();
      
      this.initialized = true;
      errorHandler.log('info', 'Options page initialized successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Options page initialization failed', error);
      this.showError('Failed to initialize options page: ' + error.message);
      this.setupMinimalFunctionality();
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

  async safeLoadData() {
    try {
      const data = await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          return await browser.storage.local.get(['settings', 'detectedDomains', 'statistics']);
        }, 'load_data'),
        12000,
        'data loading'
      );
      
      // Validate and load settings
      if (data.settings) {
        try {
          const validatedSettings = DataValidator.validateSettings(data.settings);
          this.settings = { ...this.settings, ...validatedSettings };
          errorHandler.log('info', 'Settings loaded and validated');
        } catch (error) {
          errorHandler.log('warn', 'Invalid settings found, using defaults', error);
        }
      }
      
      // Validate and load domains
      if (data.detectedDomains) {
        try {
          const domainEntries = Object.entries(data.detectedDomains).map(([domain, info]) => ({
            domain,
            ...info
          }));
          this.domains = DataValidator.validateDomainData(domainEntries);
          errorHandler.log('info', `Loaded ${this.domains.length} domains`);
        } catch (error) {
          errorHandler.log('warn', 'Error loading domains, using empty array', error);
          this.domains = [];
        }
      }
      
      // Load statistics
      if (data.statistics) {
        try {
          this.statistics = {
            blockedToday: Math.max(0, parseInt(data.statistics.blockedToday) || 0),
            cookiesDeleted: Math.max(0, parseInt(data.statistics.cookiesDeleted) || 0),
            lastUpdated: data.statistics.lastUpdated || Date.now()
          };
        } catch (error) {
          errorHandler.log('warn', 'Error loading statistics', error);
          this.statistics = {};
        }
      }
      
    } catch (error) {
      errorHandler.log('error', 'Failed to load data', error);
      throw error;
    }
  }

  async safeLoadVersion() {
    try {
      const manifest = await errorHandler.withTimeout(
        browser.runtime.getManifest(),
        3000,
        'manifest loading'
      );
      
      if (manifest && manifest.version) {
        this.safeUpdateElement('version', `Version ${manifest.version}`);
      } else {
        throw new Error('No version in manifest');
      }
      
    } catch (error) {
      errorHandler.log('warn', 'Failed to load version', error);
      this.safeUpdateElement('version', 'Version ?.?.?');
    }
  }

  setupSafeEventListeners() {
    try {
      // Range inputs with error handling
      this.setupSafeRangeInput('max-hosts-entries', 'maxHostsEntries');
      this.setupSafeRangeInput('auto-export-threshold', 'autoExportThreshold');
      
      // Radio buttons with error handling
      this.setupSafeRadioGroup('sensitivity', 'detectionSensitivity');
      this.setupSafeRadioGroup('export-format', 'exportFormat');
      
      // Checkboxes with error handling
      this.setupSafeCheckbox('block-self-hosted', 'blockSelfHosted');
      this.setupSafeCheckbox('debug-logging', 'debugLogging');
      this.setupSafeCheckbox('delete-zombie-cookies', 'deleteZombieCookies');
      this.setupSafeCheckbox('auto-cleanup', 'autoCleanup');
      
      // Action buttons with error handling
      this.safeAddEventListener('save-settings', 'click', () => {
        this.safeSaveSettings();
      });
      
      this.safeAddEventListener('export-data', 'click', () => {
        this.safeExportAllData();
      });
      
      this.safeAddEventListener('import-data', 'click', () => {
        this.triggerSafeImport();
      });
      
      this.safeAddEventListener('import-file', 'change', (e) => {
        this.safeImportData(e.target.files[0]);
      });
      
      this.safeAddEventListener('clear-data', 'click', () => {
        this.safeClearAllData();
      });
      
      errorHandler.log('info', 'Event listeners setup successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to setup event listeners', error);
    }
  }

  setupSafeRangeInput(inputId, settingKey) {
    try {
      const input = this.safeGetElement(inputId);
      const valueDisplay = this.safeGetElement(inputId.replace('-entries', '-value').replace('-threshold', '-value'));
      
      if (!input) {
        errorHandler.log('warn', `Range input ${inputId} not found`);
        return;
      }
      
      input.addEventListener('input', (e) => {
        try {
          const value = parseInt(e.target.value);
          if (isNaN(value)) {
            errorHandler.log('warn', 'Invalid range input value', null, { inputId, value: e.target.value });
            return;
          }
          
          this.settings[settingKey] = value;
          if (valueDisplay) {
            valueDisplay.textContent = value;
          }
          
          // Update auto-export threshold max based on max hosts entries
          if (settingKey === 'maxHostsEntries') {
            this.updateAutoExportThresholdMax(value);
          }
          
        } catch (error) {
          errorHandler.log('error', `Error in range input handler for ${inputId}`, error);
        }
      });
      
    } catch (error) {
      errorHandler.log('error', `Failed to setup range input ${inputId}`, error);
    }
  }

  updateAutoExportThresholdMax(maxEntries) {
    try {
      const thresholdInput = this.safeGetElement('auto-export-threshold');
      const thresholdDisplay = this.safeGetElement('auto-export-value');
      
      if (thresholdInput) {
        const newMax = maxEntries - 50;
        thresholdInput.max = newMax;
        
        if (this.settings.autoExportThreshold >= maxEntries) {
          this.settings.autoExportThreshold = newMax;
          thresholdInput.value = this.settings.autoExportThreshold;
          if (thresholdDisplay) {
            thresholdDisplay.textContent = this.settings.autoExportThreshold;
          }
        }
      }
      
    } catch (error) {
      errorHandler.log('warn', 'Error updating auto-export threshold max', error);
    }
  }

  setupSafeRadioGroup(groupName, settingKey) {
    try {
      const radios = document.querySelectorAll(`input[name="${groupName}"]`);
      
      radios.forEach(radio => {
        try {
          radio.addEventListener('change', (e) => {
            try {
              if (e.target.checked) {
                this.settings[settingKey] = e.target.value;
              }
            } catch (error) {
              errorHandler.log('error', `Error in radio change handler for ${groupName}`, error);
            }
          });
        } catch (error) {
          errorHandler.log('warn', `Error setting up radio button in group ${groupName}`, error);
        }
      });
      
    } catch (error) {
      errorHandler.log('error', `Failed to setup radio group ${groupName}`, error);
    }
  }

  setupSafeCheckbox(inputId, settingKey) {
    try {
      const input = this.safeGetElement(inputId);
      
      if (!input) {
        errorHandler.log('warn', `Checkbox ${inputId} not found`);
        return;
      }
      
      input.addEventListener('change', (e) => {
        try {
          this.settings[settingKey] = e.target.checked;
        } catch (error) {
          errorHandler.log('error', `Error in checkbox handler for ${inputId}`, error);
        }
      });
      
    } catch (error) {
      errorHandler.log('error', `Failed to setup checkbox ${inputId}`, error);
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
      }
    } catch (error) {
      errorHandler.log('error', `Failed to add event listener to ${elementId}`, error);
    }
  }

  safeGetElement(id) {
    try {
      const element = document.getElementById(id);
      if (!element) {
        errorHandler.log('debug', `Element with ID '${id}' not found`);
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
          // REMOVED: innerHTML usage - this was causing the AMO warning!
          console.warn('HTML content update attempted but innerHTML is not safe to use');
          return false;
        } else {
          element.textContent = content;
        }
        return true;
      }
      return false;
    } catch (error) {
      errorHandler.log('warn', `Error updating element ${id}`, error);
      return false;
    }
  }

  safeUpdateUI() {
    try {
      // Update range inputs
      this.safeSetValue('max-hosts-entries', this.settings.maxHostsEntries);
      this.safeUpdateElement('max-hosts-value', this.settings.maxHostsEntries);
      
      this.safeSetValue('auto-export-threshold', this.settings.autoExportThreshold);
      this.safeUpdateElement('auto-export-value', this.settings.autoExportThreshold);
      
      // Update radio buttons
      this.safeSetRadioValue('sensitivity', this.settings.detectionSensitivity);
      this.safeSetRadioValue('export-format', this.settings.exportFormat);
      
      // Update checkboxes
      this.safeSetChecked('block-self-hosted', this.settings.blockSelfHosted);
      this.safeSetChecked('debug-logging', this.settings.debugLogging);
      this.safeSetChecked('delete-zombie-cookies', this.settings.deleteZombieCookies);
      this.safeSetChecked('auto-cleanup', this.settings.autoCleanup);
      
      // Update statistics
      this.safeUpdateStatistics();
      
      // Update domains table
      this.safeUpdateDomainsTable();
      
      errorHandler.log('info', 'UI updated successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to update UI', error);
      this.showError('Failed to update interface');
    }
  }

  safeSetValue(elementId, value) {
    try {
      const element = this.safeGetElement(elementId);
      if (element && typeof value !== 'undefined') {
        element.value = value;
      }
    } catch (error) {
      errorHandler.log('warn', `Error setting value for ${elementId}`, error);
    }
  }

  safeSetRadioValue(groupName, value) {
    try {
      const radio = document.querySelector(`input[name="${groupName}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
      }
    } catch (error) {
      errorHandler.log('warn', `Error setting radio value for ${groupName}`, error);
    }
  }

  safeSetChecked(elementId, checked) {
    try {
      const element = this.safeGetElement(elementId);
      if (element) {
        element.checked = Boolean(checked);
      }
    } catch (error) {
      errorHandler.log('warn', `Error setting checked state for ${elementId}`, error);
    }
  }

  safeUpdateStatistics() {
    try {
      this.safeUpdateElement('total-blocked', (this.statistics.blockedToday || 0).toLocaleString());
      this.safeUpdateElement('cookies-deleted', (this.statistics.cookiesDeleted || 0).toLocaleString());
      this.safeUpdateElement('domains-detected', this.domains.length.toLocaleString());
      this.safeUpdateElement('hosts-entries', this.getSafeExportableDomainsCount().toLocaleString());
    } catch (error) {
      errorHandler.log('error', 'Error updating statistics', error);
    }
  }

  getSafeExportableDomainsCount() {
    try {
      const THIRD_PARTY_TRACKING_DOMAINS = [
        'google-analytics.com', 'googletagmanager.com', 'facebook.com', 'connect.facebook.net',
        '2o7.net', 'omtrdc.net', 'demdex.net', 'everesttech.net', 'hotjar.com', 'fullstory.com',
        'logrocket.com', 'mouseflow.com', 'smartlook.com', 'analytics.tiktok.com',
        'business-api.tiktok.com', 'stats.wp.com', 'scorecardresearch.com', 'quantserve.com',
        'doubleclick.net', 'googlesyndication.com', 'analytics.twitter.com', 'platform.twitter.com'
      ];
      
      return this.domains.filter(domain => {
        try {
          const domainName = domain.domain.toLowerCase();
          return THIRD_PARTY_TRACKING_DOMAINS.some(tracker => 
            domainName === tracker || domainName.endsWith('.' + tracker)
          );
        } catch (error) {
          errorHandler.log('warn', 'Error processing domain for export count', error, { domain });
          return false;
        }
      }).length;
      
    } catch (error) {
      errorHandler.log('error', 'Error calculating exportable domains count', error);
      return 0;
    }
  }

  safeUpdateDomainsTable() {
    try {
      const tableBody = this.safeGetElement('domains-table-body');
      if (!tableBody) return;
      
      // Clear existing content safely
      while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
      }
      
      if (this.domains.length === 0) {
        const noDataRow = OptionsDOMHelper.createTableRow([
          { text: 'No domains detected yet', style: 'text-align: center; color: #718096;' }
        ]);
        noDataRow.firstChild.colSpan = 5;
        tableBody.appendChild(noDataRow);
        return;
      }
      
      // Sort domains by last seen (most recent first) with error handling
      const sortedDomains = [...this.domains].sort((a, b) => {
        try {
          return (b.lastSeen || 0) - (a.lastSeen || 0);
        } catch (error) {
          errorHandler.log('warn', 'Error sorting domains', error);
          return 0;
        }
      });
      
      const rows = sortedDomains.slice(0, 50).map(domain => {
        try {
          const firstSeen = this.safeFormatDate(domain.firstSeen);
          const lastSeen = this.safeFormatDate(domain.lastSeen);
          const types = domain.gaTypes ? domain.gaTypes.join(', ') : 'unknown';
          
          return OptionsDOMHelper.createTableRow([
            { text: domain.domain, title: domain.domain },
            firstSeen,
            lastSeen,
            String(domain.frequency || 1),
            types
          ]);
        } catch (error) {
          errorHandler.log('warn', 'Error formatting domain row', error, { domain });
          return OptionsDOMHelper.createTableRow([
            { text: 'Error displaying domain', style: 'color: #ef4444;' }
          ]);
        }
      });
      
      rows.forEach(row => {
        if (row) tableBody.appendChild(row);
      });
      
      if (sortedDomains.length > 50) {
        const moreRow = OptionsDOMHelper.createTableRow([
          { 
            text: `Showing 50 of ${sortedDomains.length} detected domains`, 
            style: 'text-align: center; color: #718096; font-style: italic;' 
          }
        ]);
        moreRow.firstChild.colSpan = 5;
        tableBody.appendChild(moreRow);
      }
      
    } catch (error) {
      errorHandler.log('error', 'Error updating domains table', error);
      const tableBody = this.safeGetElement('domains-table-body');
      if (tableBody) {
        // Clear safely
        while (tableBody.firstChild) {
          tableBody.removeChild(tableBody.firstChild);
        }
        const errorRow = OptionsDOMHelper.createTableRow([
          { text: 'Error loading domains', style: 'text-align: center; color: #ef4444;' }
        ]);
        errorRow.firstChild.colSpan = 5;
        tableBody.appendChild(errorRow);
      }
    }
  }

  safeFormatDate(timestamp) {
    try {
      if (!timestamp || isNaN(timestamp)) {
        return 'Unknown';
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      errorHandler.log('warn', 'Error formatting date', error, { timestamp });
      return 'Invalid';
    }
  }

  async safeSaveSettings() {
    if (this.saveInProgress) {
      this.showWarning('Save already in progress');
      return;
    }

    try {
      this.saveInProgress = true;
      
      // Validate settings before saving
      const validatedSettings = DataValidator.validateSettings(this.settings);
      
      await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          await browser.storage.local.set({ settings: validatedSettings });
        }, 'save_settings'),
        8000,
        'settings save'
      );
      
      // Send updated settings to background script
      try {
        await browser.runtime.sendMessage({
          type: 'SETTINGS_UPDATED',
          settings: validatedSettings
        });
      } catch (msgError) {
        errorHandler.log('warn', 'Failed to notify background script of settings update', msgError);
      }
      
      this.showSuccess('Settings saved successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to save settings', error);
      this.showError('Failed to save settings: ' + error.message);
    } finally {
      this.saveInProgress = false;
    }
  }

  safeExportAllData() {
    try {
      const exportData = {
        settings: this.settings,
        domains: this.domains,
        statistics: this.statistics,
        exportedAt: new Date().toISOString(),
        version: '1.3.0',
        criticalErrors: errorHandler.getCriticalErrors()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `nixxer-export-${Date.now()}.json`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.showSuccess('Data exported successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to export data', error);
      this.showError('Failed to export data: ' + error.message);
    }
  }

  triggerSafeImport() {
    try {
      const fileInput = this.safeGetElement('import-file');
      if (fileInput) {
        fileInput.click();
      } else {
        throw new Error('Import file input not found');
      }
    } catch (error) {
      errorHandler.log('error', 'Failed to trigger import', error);
      this.showError('Failed to open file picker');
    }
  }

  async safeImportData(file) {
    if (!file) return;
    
    try {
      // Validate file
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        throw new Error('Please select a valid JSON file');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large (max 10MB)');
      }
      
      const text = await errorHandler.withTimeout(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = e => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        }),
        10000,
        'file reading'
      );
      
      const data = JSON.parse(text);
      const validatedData = DataValidator.validateImportData(data);
      
      // Confirm import
      if (!confirm('This will overwrite all current settings and data. Continue?')) {
        return;
      }
      
      // Update local data
      this.settings = { ...this.settings, ...validatedData.settings };
      this.domains = validatedData.domains || [];
      this.statistics = validatedData.statistics || {};
      
      // Save to storage
      await this.safeSaveImportedData(validatedData);
      
      // Update UI
      this.safeUpdateUI();
      
      this.showSuccess('Data imported successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Import failed', error);
      this.showError('Failed to import data: ' + error.message);
    }
  }

  async safeSaveImportedData(validatedData) {
    try {
      const storageData = {
        settings: validatedData.settings,
        detectedDomains: {},
        statistics: validatedData.statistics
      };
      
      // Convert domains array back to object format
      validatedData.domains.forEach(domain => {
        try {
          storageData.detectedDomains[domain.domain] = {
            firstSeen: domain.firstSeen,
            lastSeen: domain.lastSeen,
            frequency: domain.frequency,
            gaTypes: domain.gaTypes,
            blocked: domain.blocked,
            details: domain.details
          };
        } catch (error) {
          errorHandler.log('warn', 'Error processing domain for import', error, { domain });
        }
      });
      
      await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          await browser.storage.local.set(storageData);
        }, 'save_imported_data'),
        15000,
        'imported data save'
      );
      
    } catch (error) {
      errorHandler.log('error', 'Failed to save imported data', error);
      throw error;
    }
  }

  async safeClearAllData() {
    try {
      if (!confirm('This will permanently delete all Nixxer data including detected domains, statistics, and settings. This cannot be undone. Continue?')) {
        return;
      }
      
      if (!confirm('Are you absolutely sure? This action cannot be reversed.')) {
        return;
      }
      
      await errorHandler.withTimeout(
        errorHandler.withRetry(async () => {
          await browser.storage.local.clear();
        }, 'clear_all_data'),
        10000,
        'data clearing'
      );
      
      // Reset local data
      this.settings = {
        detectionSensitivity: 'high',
        blockSelfHosted: true,
        debugLogging: false,
        deleteZombieCookies: true,
        maxHostsEntries: 500,
        autoExportThreshold: 450,
        autoCleanup: true,
        exportFormat: 'pihole'
      };
      this.domains = [];
      this.statistics = {};
      
      // Update UI
      this.safeUpdateUI();
      
      this.showSuccess('All data cleared successfully');
      
    } catch (error) {
      errorHandler.log('error', 'Failed to clear data', error);
      this.showError('Failed to clear data: ' + error.message);
    }
  }

  showSuccess(message) {
    try {
      this.showMessage(message, 'success');
    } catch (error) {
      errorHandler.log('warn', 'Error showing success message', error);
    }
  }

  showError(message) {
    try {
      this.showMessage(message, 'error');
    } catch (error) {
      errorHandler.log('warn', 'Error showing error message', error);
    }
  }

  showWarning(message) {
    try {
      this.showMessage(message, 'warning');
    } catch (error) {
      errorHandler.log('warn', 'Error showing warning message', error);
    }
  }

  showMessage(message, type = 'info') {
    try {
      const successEl = this.safeGetElement('success-message');
      const errorEl = this.safeGetElement('error-message');
      
      // Hide both messages first
      if (successEl) successEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';
      
      let targetElement;
      if (type === 'error' && errorEl) {
        targetElement = errorEl;
      } else if ((type === 'success' || type === 'warning') && successEl) {
        targetElement = successEl;
        // Change styling for warnings
        if (type === 'warning') {
          targetElement.style.background = '#fed7aa';
          targetElement.style.color = '#9a3412';
        } else {
          targetElement.style.background = '#c6f6d5';
          targetElement.style.color = '#22543d';
        }
      }
      
      if (targetElement) {
        targetElement.textContent = message;
        targetElement.style.display = 'block';
        
        // Auto-hide after delay
        const hideDelay = type === 'error' ? 8000 : 5000;
        setTimeout(() => {
          if (targetElement) {
            targetElement.style.display = 'none';
          }
        }, hideDelay);
      }
      
    } catch (error) {
      errorHandler.log('warn', 'Error showing message', error);
      // Fallback to console
      console.log(`Nixxer ${type}: ${message}`);
    }
  }

  setupMinimalFunctionality() {
    try {
      errorHandler.log('info', 'Setting up minimal functionality fallback');
      
      // Replace the main container with error page
      const container = document.querySelector('.container');
      if (container && container.parentNode) {
        const errorPage = OptionsDOMHelper.createErrorPage(
          'Extension initialization failed',
          errorHandler.getCriticalErrors()
        );
        container.parentNode.replaceChild(errorPage, container);
      }
      
    } catch (error) {
      errorHandler.log('error', 'Failed to setup minimal functionality', error);
      
      // Last resort: basic error display
      try {
        const errorContainer = OptionsDOMHelper.createTextElement('div', 
          'Critical extension error. Please check the browser console and try reloading the page.');
        errorContainer.style.cssText = 'padding: 40px; text-align: center; font-family: Arial, sans-serif; color: #ef4444;';
        
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Reload Page';
        retryButton.style.cssText = 'padding: 10px 20px; margin-top: 20px;';
        retryButton.onclick = () => window.location.reload();
        
        errorContainer.appendChild(document.createElement('br'));
        errorContainer.appendChild(retryButton);
        
        document.body.appendChild(errorContainer);
      } catch (finalError) {
        console.error('Complete options page failure:', finalError);
      }
    }
  }
}

// Safe initialization with comprehensive error handling
function safeInitializeOptions() {
  try {
    // Check if we're in a valid browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Not in valid browser environment');
    }
    
    // Check if required DOM elements exist
    const requiredElements = [
      'max-hosts-entries', 'auto-export-threshold', 'save-settings',
      'export-data', 'import-data', 'clear-data', 'domains-table-body'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      errorHandler.log('warn', 'Missing required DOM elements', null, { missingElements });
      // Continue anyway - the options page will handle missing elements gracefully
    }
    
    // Initialize options page
    new SafeNixxerOptions();
    
  } catch (error) {
    errorHandler.log('error', 'Critical error initializing options page', error);
    
    // Emergency fallback using safe DOM manipulation
    try {
      const errorPage = OptionsDOMHelper.createErrorPage(
        error.message,
        [{ timestamp: new Date().toISOString(), message: error.message, error: error.stack }]
      );
      
      // Clear body and add error page
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
      }
      document.body.appendChild(errorPage);
      
    } catch (emergencyError) {
      console.error('Emergency fallback also failed:', emergencyError);
      
      // Final fallback
      try {
        const finalError = OptionsDOMHelper.createTextElement('div', 
          'Critical extension error. Please check the browser console and try reloading the page.');
        finalError.style.cssText = 'padding: 40px; text-align: center; font-family: Arial, sans-serif; color: #ef4444;';
        document.body.appendChild(finalError);
      } catch (finalFallbackError) {
        console.error('Even final fallback failed:', finalFallbackError);
        alert('Critical extension error. Please check the browser console and try reloading the page.');
      }
    }
  }
}

// Enhanced initialization with multiple strategies and fallbacks
try {
  if (document.readyState === 'loading') {
    // Document still loading
    document.addEventListener('DOMContentLoaded', () => {
      try {
        safeInitializeOptions();
      } catch (error) {
        errorHandler.log('error', 'Error in DOMContentLoaded handler', error);
      }
    });
    
    // Fallback timeout in case DOMContentLoaded doesn't fire
    setTimeout(() => {
      try {
        if (document.readyState !== 'loading') {
          safeInitializeOptions();
        }
      } catch (error) {
        errorHandler.log('error', 'Error in fallback initialization', error);
      }
    }, 3000);
    
  } else {
    // Document already loaded
    safeInitializeOptions();
  }
  
} catch (error) {
  errorHandler.log('error', 'Critical error in initialization setup', error);
  
  // Last resort: direct initialization with delay
  setTimeout(() => {
    try {
      safeInitializeOptions();
    } catch (lastResortError) {
      console.error('Complete options page initialization failure:', lastResortError);
      
      // Final emergency display
      try {
        const finalErrorDiv = OptionsDOMHelper.createTextElement('div', 
          'Critical Extension Error. The options page could not be initialized.');
        finalErrorDiv.style.cssText = 'padding: 40px; text-align: center; font-family: Arial, sans-serif; color: #ef4444;';
        
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Reload Page';
        retryButton.style.cssText = 'padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;';
        retryButton.onclick = () => window.location.reload();
        
        finalErrorDiv.appendChild(document.createElement('br'));
        finalErrorDiv.appendChild(retryButton);
        
        if (document.body) {
          document.body.appendChild(finalErrorDiv);
        }
      } catch (finalDisplayError) {
        console.error('Could not even show final error display:', finalDisplayError);
      }
    }
  }, 5000);
}

// Global error handlers for the options page
try {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
      errorHandler.log('error', 'Unhandled error in options page', event.error);
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason) {
      errorHandler.log('error', 'Unhandled promise rejection in options page', 
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    }
  });
  
  // Additional safety: catch any uncaught errors in setTimeout/setInterval
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = function(callback, delay, ...args) {
    return originalSetTimeout(() => {
      try {
        callback(...args);
      } catch (error) {
        errorHandler.log('error', 'Error in setTimeout callback', error);
      }
    }, delay);
  };
  
  window.setInterval = function(callback, delay, ...args) {
    return originalSetInterval(() => {
      try {
        callback(...args);
      } catch (error) {
        errorHandler.log('error', 'Error in setInterval callback', error);
      }
    }, delay);
  };
  
} catch (error) {
  console.error('Could not set up global error handlers:', error);
}