// Nixxer Background Script - Enhanced with Comprehensive Error Handling

// Enhanced error logging utility
class ErrorLogger {
  constructor() {
    this.errorCounts = new Map();
    this.maxLogLevel = 'warn'; // 'debug', 'info', 'warn', 'error'
    this.maxErrorsPerType = 5; // Prevent spam
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
    
    // Log to console based on level
    switch (level) {
      case 'debug':
        if (this.maxLogLevel === 'debug') console.debug('Nixxer Debug:', logData);
        break;
      case 'info':
        if (['debug', 'info'].includes(this.maxLogLevel)) console.info('Nixxer Info:', logData);
        break;
      case 'warn':
        if (['debug', 'info', 'warn'].includes(this.maxLogLevel)) console.warn('Nixxer Warning:', logData);
        break;
      case 'error':
        console.error('Nixxer Error:', logData);
        break;
    }
    
    // Store critical errors for user reporting
    if (level === 'error') {
      this.storeCriticalError(logData);
    }
  }

  async storeCriticalError(errorData) {
    try {
      const stored = await browser.storage.local.get(['criticalErrors']);
      const errors = stored.criticalErrors || [];
      errors.push(errorData);
      
      // Keep only last 10 critical errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      await browser.storage.local.set({ criticalErrors: errors });
    } catch (e) {
      // Can't even store the error - just console log
      console.error('Failed to store critical error:', e);
    }
  }
}

// Retry utility for transient failures
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// Timeout wrapper for hanging operations
function withTimeout(promise, timeoutMs = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Data validation utilities
function validateDomain(domain) {
  if (typeof domain !== 'string' || domain.length === 0) {
    throw new Error('Invalid domain: must be non-empty string');
  }
  if (domain.length > 253) {
    throw new Error('Invalid domain: too long');
  }
  return domain.toLowerCase().trim();
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings must be an object');
  }
  
  // Validate numeric settings
  if (settings.maxHostsEntries !== undefined) {
    const max = parseInt(settings.maxHostsEntries);
    if (isNaN(max) || max < 50 || max > 10000) {
      throw new Error('maxHostsEntries must be between 50 and 10000');
    }
    settings.maxHostsEntries = max;
  }
  
  if (settings.autoExportThreshold !== undefined) {
    const threshold = parseInt(settings.autoExportThreshold);
    if (isNaN(threshold) || threshold < 10) {
      throw new Error('autoExportThreshold must be at least 10');
    }
    settings.autoExportThreshold = threshold;
  }
  
  return settings;
}

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// OPTIMIZATION: Cache for compiled regex patterns
const patternCache = new Map();

function getPattern(patternString) {
  if (!patternCache.has(patternString)) {
    try {
      patternCache.set(patternString, new RegExp(patternString));
    } catch (error) {
      logger.log('error', 'Invalid regex pattern', error, { pattern: patternString });
      return null;
    }
  }
  return patternCache.get(patternString);
}

// Detection patterns with error handling
const GA_COOKIE_PATTERNS = [
  /^_ga$/,
  /^_gid$/,
  /^_gat/,
  /^_gtag_/,
  /^__utm[abcz]$/
];

const GTM_COOKIE_PATTERNS = [
  /^_gcl_/,
  /^_gac_/,
  /^_dc_gtm_/,
  /^_fbc$/,
  /^_fbp$/
];

const GA_VALUE_PATTERNS = [
  /^GA1\.\d+\.\d+\.\d+$/,
  /^GA1\.\d+\.\d+$/
];

const GA_REQUEST_PATTERNS = [
  /\/collect(\?|$)/,
  /\/g\/collect(\?|$)/,
  /\/mp\/collect(\?|$)/,
  /\/gtm\.js(\?|$)/,
  /\/gtag\/js(\?|$)/,
  /google-analytics\.com/,
  /googletagmanager\.com/
];

// Facebook/Meta tracking patterns
const FACEBOOK_COOKIE_PATTERNS = [
  /^_fbc$/,
  /^_fbp$/,
  /^fr$/,
  /^datr$/,
  /^sb$/,
  /^wd$/
];

const FACEBOOK_REQUEST_PATTERNS = [
  /facebook\.com\/tr/,
  /connect\.facebook\.net/,
  /\.facebook\.com\/plugins/,
  /fbevents\.js/
];

// Adobe Analytics patterns
const ADOBE_COOKIE_PATTERNS = [
  /^s_cc$/,
  /^s_sq$/,
  /^s_vi$/,
  /^s_fid$/,
  /^AMCV_/,
  /^mbox/
];

const ADOBE_REQUEST_PATTERNS = [
  /2o7\.net/,
  /omtrdc\.net/,
  /demdex\.net/,
  /everesttech\.net/
];

// Session recording/heatmap patterns
const SESSION_RECORDING_COOKIE_PATTERNS = [
  /^_hjid$/,
  /^_hjSession/,
  /^_hjIncludedInSample/,
  /^fs_uid$/,
  /^FS\./,
  /^_lr_/,
  /^_hotjar/
];

const SESSION_RECORDING_REQUEST_PATTERNS = [
  /hotjar\.com/,
  /fullstory\.com/,
  /logrocket\.com/,
  /mouseflow\.com/,
  /smartlook\.com/
];

// TikTok tracking patterns
const TIKTOK_COOKIE_PATTERNS = [
  /^_ttp$/,
  /^_tt_enable_cookie$/,
  /^tt_pixel_session_index$/,
  /^tt_sessionId$/
];

const TIKTOK_REQUEST_PATTERNS = [
  /analytics\.tiktok\.com/,
  /business-api\.tiktok\.com/,
  /\.tiktok\.com\/pixel/
];

// Known tracking domains with error handling
const KNOWN_TRACKING_DOMAINS = new Set([
  'google-analytics.com',
  'googletagmanager.com',
  'www.google-analytics.com',
  'www.googletagmanager.com',
  'facebook.com',
  'connect.facebook.net',
  'www.facebook.com',
  '2o7.net',
  'omtrdc.net',
  'demdex.net',
  'everesttech.net',
  'hotjar.com',
  'fullstory.com',
  'logrocket.com',
  'mouseflow.com',
  'smartlook.com',
  'analytics.tiktok.com',
  'business-api.tiktok.com',
  'stats.wp.com',
  'scorecardresearch.com',
  'quantserve.com',
  'doubleclick.net',
  'googlesyndication.com',
  'analytics.twitter.com',
  'platform.twitter.com'
]);

const TRACKING_DOMAIN_SUFFIXES = new Set([
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'hotjar.com',
  'fullstory.com',
  'doubleclick.net'
]);

// Initialize error logger
const logger = new ErrorLogger();

class NixxerCore {
  constructor() {
    this.isEnabled = true;
    this.blockedToday = 0;
    this.cookiesDeleted = 0;
    this.detectedDomains = new Map();
    this.settings = {
      maxHostsEntries: 500,
      autoExportThreshold: 450,
      detectionSensitivity: 'high',
      exportFormat: 'pihole',
      blockSelfHosted: true,
      debugLogging: false,
      autoCleanup: true
    };
    
    this.performanceStats = {
      requestsProcessed: 0,
      requestsBlocked: 0,
      avgProcessingTime: 0
    };
    
    this.pendingSave = false;
    this.debouncedSave = debounce(this.saveData.bind(this), 3000);
    
    this.recentRequests = new Map();
    this.cleanupRecentRequests = debounce(() => {
      try {
        const cutoff = Date.now() - 5000;
        for (const [url, timestamp] of this.recentRequests.entries()) {
          if (timestamp < cutoff) {
            this.recentRequests.delete(url);
          }
        }
      } catch (error) {
        logger.log('warn', 'Failed to cleanup recent requests', error);
      }
    }, 10000);
    
    // Track initialization status
    this.initialized = false;
    this.initializationError = null;
    
    this.init();
  }

  async init() {
    try {
      logger.log('info', 'Starting Nixxer initialization');
      
      await this.loadStoredData();
      await this.setupRequestBlocking();
      await this.setupCookieMonitoring();
      this.setupMessageHandling();
      this.scheduleCleanup();
      this.schedulePerformanceReporting();
      
      this.initialized = true;
      logger.log('info', 'Nixxer initialized successfully with enhanced error handling');
      
    } catch (error) {
      this.initializationError = error;
      logger.log('error', 'Nixxer initialization failed', error);
      
      // Try to continue with limited functionality
      this.setupBasicMessageHandling();
    }
  }

  async loadStoredData() {
    try {
      const data = await withTimeout(
        withRetry(() => browser.storage.local.get(['detectedDomains', 'settings', 'statistics'])),
        5000
      );
      
      if (data.detectedDomains && typeof data.detectedDomains === 'object') {
        try {
          this.detectedDomains = new Map(Object.entries(data.detectedDomains));
          logger.log('info', `Loaded ${this.detectedDomains.size} detected domains`);
        } catch (error) {
          logger.log('warn', 'Failed to parse detected domains, using empty map', error);
          this.detectedDomains = new Map();
        }
      }
      
      if (data.settings && typeof data.settings === 'object') {
        try {
          const validatedSettings = validateSettings(data.settings);
          this.settings = Object.assign(this.settings, validatedSettings);
          logger.log('info', 'Settings loaded and validated');
        } catch (error) {
          logger.log('warn', 'Invalid settings found, using defaults', error);
        }
      }
      
      if (data.statistics && typeof data.statistics === 'object') {
        try {
          this.blockedToday = Math.max(0, parseInt(data.statistics.blockedToday) || 0);
          this.cookiesDeleted = Math.max(0, parseInt(data.statistics.cookiesDeleted) || 0);
          
          const lastUpdated = data.statistics.lastUpdated || Date.now();
          const daysDiff = Math.floor((Date.now() - lastUpdated) / (24 * 60 * 60 * 1000));
          if (daysDiff >= 1) {
            this.blockedToday = 0;
          }
          
          logger.log('info', 'Statistics loaded successfully');
        } catch (error) {
          logger.log('warn', 'Failed to parse statistics, using defaults', error);
          this.blockedToday = 0;
          this.cookiesDeleted = 0;
        }
      }
      
    } catch (error) {
      logger.log('error', 'Failed to load stored data', error);
      // Continue with default values
    }
  }

  async saveData() {
    if (this.pendingSave) {
      logger.log('debug', 'Save already pending, skipping');
      return;
    }
    
    try {
      this.pendingSave = true;
      
      const dataToSave = {
        detectedDomains: Object.fromEntries(this.detectedDomains),
        settings: this.settings,
        statistics: {
          blockedToday: this.blockedToday,
          cookiesDeleted: this.cookiesDeleted,
          lastUpdated: Date.now()
        }
      };
      
      await withTimeout(
        withRetry(() => browser.storage.local.set(dataToSave)),
        8000
      );
      
      logger.log('debug', 'Data saved successfully');
      
    } catch (error) {
      logger.log('error', 'Failed to save data', error, {
        detectedDomainsSize: this.detectedDomains.size,
        settingsKeys: Object.keys(this.settings)
      });
      
      // Try to save critical data only
      try {
        await browser.storage.local.set({
          statistics: {
            blockedToday: this.blockedToday,
            cookiesDeleted: this.cookiesDeleted,
            lastUpdated: Date.now()
          }
        });
        logger.log('info', 'Saved critical statistics only');
      } catch (criticalError) {
        logger.log('error', 'Failed to save even critical data', criticalError);
      }
      
    } finally {
      this.pendingSave = false;
    }
  }

  isKnownTrackingDomain(hostname) {
    try {
      if (typeof hostname !== 'string') {
        return false;
      }
      
      const cleanHostname = hostname.toLowerCase().trim();
      
      if (KNOWN_TRACKING_DOMAINS.has(cleanHostname)) {
        return true;
      }
      
      for (const suffix of TRACKING_DOMAIN_SUFFIXES) {
        if (cleanHostname.endsWith(suffix)) {
          return true;
        }
      }
      
      for (const domain of KNOWN_TRACKING_DOMAINS) {
        if (cleanHostname.endsWith('.' + domain)) {
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      logger.log('warn', 'Error checking tracking domain', error, { hostname });
      return false;
    }
  }

  async setupRequestBlocking() {
    try {
      if (!browser.webRequest) {
        throw new Error('WebRequest API not available');
      }
      
      browser.webRequest.onBeforeRequest.addListener(
        (details) => {
          try {
            if (!this.isEnabled) return {};
            
            const now = Date.now();
            if (this.recentRequests.has(details.url)) {
              const lastSeen = this.recentRequests.get(details.url);
              if (now - lastSeen < 1000) {
                return {};
              }
            }
            this.recentRequests.set(details.url, now);
            this.cleanupRecentRequests();
            
            const startTime = performance.now();
            
            try {
              const url = new URL(details.url);
              const hostname = url.hostname;
              
              if (!this.isKnownTrackingDomain(hostname) && !this.isTrackingRequest(details.url)) {
                this.updatePerformanceStats(startTime, false);
                return {};
              }
              
              const blockingInfo = this.determineBlockingTarget(hostname, 'request', details.url);
              
              if (blockingInfo.shouldBlock) {
                this.handleTrackerDetection(hostname, 'request', details.url);
                this.blockedToday++;
                
                logger.log('debug', 'Blocked tracking request', null, { url: details.url });
                
                this.updatePerformanceStats(startTime, true);
                return { cancel: true };
              }
              
              this.updatePerformanceStats(startTime, false);
              
            } catch (error) {
              logger.log('warn', 'Error processing request', error, { 
                url: details.url,
                type: details.type 
              });
              this.updatePerformanceStats(startTime, false);
            }
            
            return {};
            
          } catch (error) {
            logger.log('error', 'Critical error in request blocking', error);
            return {};
          }
        },
        { urls: ['<all_urls>'] },
        ['blocking']
      );
      
      logger.log('info', 'Request blocking setup successfully');
      
    } catch (error) {
      logger.log('error', 'Failed to setup request blocking', error);
      throw error;
    }
  }

  updatePerformanceStats(startTime, blocked) {
    try {
      const processingTime = performance.now() - startTime;
      this.performanceStats.requestsProcessed++;
      if (blocked) {
        this.performanceStats.requestsBlocked++;
      }
      
      this.performanceStats.avgProcessingTime = 
        (this.performanceStats.avgProcessingTime * (this.performanceStats.requestsProcessed - 1) + processingTime) / 
        this.performanceStats.requestsProcessed;
        
    } catch (error) {
      logger.log('warn', 'Error updating performance stats', error);
    }
  }

  schedulePerformanceReporting() {
    try {
      setInterval(() => {
        try {
          if (this.settings.debugLogging && this.performanceStats.requestsProcessed > 0) {
            logger.log('info', 'Performance Stats', null, {
              requestsProcessed: this.performanceStats.requestsProcessed,
              requestsBlocked: this.performanceStats.requestsBlocked,
              blockingRate: (this.performanceStats.requestsBlocked / this.performanceStats.requestsProcessed * 100).toFixed(2) + '%',
              avgProcessingTime: this.performanceStats.avgProcessingTime.toFixed(3) + 'ms'
            });
          }
        } catch (error) {
          logger.log('warn', 'Error in performance reporting', error);
        }
      }, 60000);
    } catch (error) {
      logger.log('warn', 'Failed to schedule performance reporting', error);
    }
  }

  async setupCookieMonitoring() {
    try {
      if (!browser.cookies) {
        throw new Error('Cookies API not available');
      }
      
      browser.cookies.onChanged.addListener((changeInfo) => {
        try {
          if (!this.isEnabled || changeInfo.removed) return;
          
          const cookie = changeInfo.cookie;
          if (!cookie || !cookie.name) return;
          
          if (this.isTrackingCookie(cookie.name, cookie.value)) {
            this.handleTrackerDetection(cookie.domain, 'cookie', cookie.name);
            this.deleteCookie(cookie);
          }
          
        } catch (error) {
          logger.log('warn', 'Error in cookie monitoring', error, {
            cookieName: changeInfo.cookie?.name,
            domain: changeInfo.cookie?.domain
          });
        }
      });
      
      setInterval(() => {
        try {
          this.cleanupCookies();
        } catch (error) {
          logger.log('warn', 'Error in periodic cookie cleanup', error);
        }
      }, 30000);
      
      logger.log('info', 'Cookie monitoring setup successfully');
      
    } catch (error) {
      logger.log('error', 'Failed to setup cookie monitoring', error);
      throw error;
    }
  }

  setupMessageHandling() {
    try {
      if (!browser.runtime) {
        throw new Error('Runtime API not available');
      }
      
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Wrap in async handler with error catching
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      });
      
      logger.log('info', 'Message handling setup successfully');
      
    } catch (error) {
      logger.log('error', 'Failed to setup message handling', error);
      this.setupBasicMessageHandling();
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      if (!message || typeof message.type !== 'string') {
        sendResponse({ error: 'Invalid message format' });
        return;
      }
      
      switch (message.type) {
        case 'GA_DETECTED':
          try {
            const domain = validateDomain(message.domain || '');
            await this.handleTrackerDetection(domain, message.method, message.details);
            sendResponse({ success: true });
          } catch (error) {
            logger.log('warn', 'Error handling GA detection', error);
            sendResponse({ error: 'Failed to process detection' });
          }
          break;
        
        case 'GET_STATS':
          try {
            const stats = this.getStats();
            if (this.initializationError) {
              stats.initializationError = this.initializationError.message;
            }
            sendResponse(stats);
          } catch (error) {
            logger.log('error', 'Error getting stats', error);
            sendResponse({ 
              error: 'Failed to get statistics',
              enabled: this.isEnabled,
              blockedToday: this.blockedToday || 0,
              cookiesDeleted: this.cookiesDeleted || 0,
              totalDomains: this.detectedDomains?.size || 0
            });
          }
          break;
        
        case 'TOGGLE_ENABLED':
          try {
            this.isEnabled = !this.isEnabled;
            logger.log('info', `Extension ${this.isEnabled ? 'enabled' : 'disabled'}`);
            sendResponse({ enabled: this.isEnabled });
          } catch (error) {
            logger.log('error', 'Error toggling extension', error);
            sendResponse({ error: 'Failed to toggle extension' });
          }
          break;
        
        case 'EXPORT_BLOCKLIST':
          try {
            const format = message.format || 'pihole';
            const result = await this.exportBlocklist(format);
            sendResponse(result);
          } catch (error) {
            logger.log('error', 'Error exporting blocklist', error, { format: message.format });
            sendResponse({ error: 'Export failed: ' + error.message });
          }
          break;
        
        case 'GET_DETECTED_DOMAINS':
          try {
            const domains = Array.from(this.detectedDomains.entries());
            sendResponse(domains);
          } catch (error) {
            logger.log('error', 'Error getting detected domains', error);
            sendResponse({ error: 'Failed to get domains' });
          }
          break;
        
        case 'SETTINGS_UPDATED':
          try {
            const validatedSettings = validateSettings(message.settings || {});
            this.settings = Object.assign(this.settings, validatedSettings);
            this.debouncedSave();
            sendResponse({ success: true });
          } catch (error) {
            logger.log('error', 'Error updating settings', error);
            sendResponse({ error: 'Invalid settings: ' + error.message });
          }
          break;
        
        case 'CLEAR_STATS':
          try {
            this.blockedToday = 0;
            this.cookiesDeleted = 0;
            this.performanceStats = {
              requestsProcessed: 0,
              requestsBlocked: 0,
              avgProcessingTime: 0
            };
            this.debouncedSave();
            sendResponse({ success: true });
          } catch (error) {
            logger.log('error', 'Error clearing stats', error);
            sendResponse({ error: 'Failed to clear statistics' });
          }
          break;

        case 'ZOMBIE_COOKIE_DETECTED':
          try {
            const domain = validateDomain(message.domain || '');
            await this.handleZombieCookieDetection(domain, message.method, message.details);
            sendResponse({ success: true });
          } catch (error) {
            logger.log('warn', 'Error handling zombie cookie detection', error);
            sendResponse({ error: 'Failed to process zombie cookie detection' });
          }
          break;

        case 'GET_ERROR_LOG':
          try {
            const errors = await browser.storage.local.get(['criticalErrors']);
            sendResponse({ errors: errors.criticalErrors || [] });
          } catch (error) {
            logger.log('error', 'Error getting error log', error);
            sendResponse({ error: 'Failed to get error log' });
          }
          break;
          
        default:
          sendResponse({ error: 'Unknown message type: ' + message.type });
      }
      
    } catch (error) {
      logger.log('error', 'Critical error in message handler', error, { messageType: message?.type });
      sendResponse({ error: 'Critical error processing message' });
    }
  }

  setupBasicMessageHandling() {
    try {
      // Fallback message handler with minimal functionality
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
          if (message.type === 'GET_STATS') {
            sendResponse({
              error: 'Extension partially functional due to initialization error',
              enabled: false,
              blockedToday: 0,
              cookiesDeleted: 0,
              totalDomains: 0
            });
          } else {
            sendResponse({ error: 'Extension not fully initialized' });
          }
        } catch (error) {
          sendResponse({ error: 'Critical error' });
        }
        return true;
      });
    } catch (error) {
      logger.log('error', 'Failed to setup even basic message handling', error);
    }
  }

  isTrackingRequest(url) {
    try {
      if (typeof url !== 'string') return false;
      
      return GA_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
             FACEBOOK_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
             ADOBE_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
             SESSION_RECORDING_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
             TIKTOK_REQUEST_PATTERNS.some(pattern => pattern.test(url));
             
    } catch (error) {
      logger.log('warn', 'Error checking tracking request', error, { url });
      return false;
    }
  }

  isTrackingCookie(name, value) {
    try {
      if (typeof name !== 'string') return false;
      
      const isGAName = GA_COOKIE_PATTERNS.some(pattern => pattern.test(name));
      const isGTMName = GTM_COOKIE_PATTERNS.some(pattern => pattern.test(name));
      const isFacebookName = FACEBOOK_COOKIE_PATTERNS.some(pattern => pattern.test(name));
      const isAdobeName = ADOBE_COOKIE_PATTERNS.some(pattern => pattern.test(name));
      const isSessionRecordingName = SESSION_RECORDING_COOKIE_PATTERNS.some(pattern => pattern.test(name));
      const isTikTokName = TIKTOK_COOKIE_PATTERNS.some(pattern => pattern.test(name));
      
      if (isGAName || isGTMName || isFacebookName || isAdobeName || isSessionRecordingName || isTikTokName) {
        if (value && typeof value === 'string' && GA_VALUE_PATTERNS.some(pattern => pattern.test(value))) {
          return true;
        }
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.log('warn', 'Error checking tracking cookie', error, { name, value });
      return false;
    }
  }

  async handleTrackerDetection(domain, method, details) {
    try {
      const now = Date.now();
      const cleanDomain = validateDomain(domain);
      const blockingInfo = this.determineBlockingTarget(cleanDomain, method, details);
      
      if (!blockingInfo.shouldBlock) {
        logger.log('debug', 'Tracker detected but no blocking action needed', null, { domain, method });
        return;
      }
      
      if (blockingInfo.addToBlocklist) {
        const domainKey = blockingInfo.targetDomain.startsWith('.') ? 
          blockingInfo.targetDomain.slice(1) : blockingInfo.targetDomain;
        
        this.updateDetectedDomain(domainKey, method, details, cleanDomain, now);
        logger.log('debug', 'Added tracking domain to blocklist', null, { domain: domainKey });
      }
      
      if (this.detectedDomains.size >= this.settings.autoExportThreshold) {
        this.manageBlocklist();
      }
      
      this.debouncedSave();
      
    } catch (error) {
      logger.log('error', 'Error handling tracker detection', error, { domain, method, details });
    }
  }

  async handleZombieCookieDetection(domain, method, details) {
    try {
      const cleanDomain = validateDomain(domain);
      logger.log('debug', 'Zombie cookie detected', null, { domain: cleanDomain, method, details });
      
      const now = Date.now();
      const zombieKey = cleanDomain + '_zombie';
      
      if (!this.detectedDomains.has(zombieKey)) {
        this.detectedDomains.set(zombieKey, {
          firstSeen: now,
          lastSeen: now,
          frequency: 1,
          gaTypes: [method],
          blocked: true,
          details: [details],
          isZombieCookie: true
        });
      } else {
        const existing = this.detectedDomains.get(zombieKey);
        existing.lastSeen = now;
        existing.frequency++;
        if (!existing.gaTypes.includes(method)) {
          existing.gaTypes.push(method);
        }
      }
      
      this.debouncedSave();
      
    } catch (error) {
      logger.log('error', 'Error handling zombie cookie detection', error, { domain, method, details });
    }
  }

  updateDetectedDomain(domainKey, method, details, hostDomain, timestamp) {
    try {
      if (!this.detectedDomains.has(domainKey)) {
        this.detectedDomains.set(domainKey, {
          firstSeen: timestamp,
          lastSeen: timestamp,
          frequency: 1,
          gaTypes: [method],
          blocked: true,
          details: [details],
          hostDomain: hostDomain
        });
      } else {
        const existing = this.detectedDomains.get(domainKey);
        existing.lastSeen = timestamp;
        existing.frequency++;
        
        if (!existing.gaTypes.includes(method)) {
          existing.gaTypes.push(method);
        }
        
        if (existing.details.length < 5) {
          existing.details.push(details);
        }
      }
    } catch (error) {
      logger.log('warn', 'Error updating detected domain', error, { domainKey, method });
    }
  }

  determineBlockingTarget(domain, method, details) {
    try {
      const THIRD_PARTY_TRACKING_DOMAINS = [
        'google-analytics.com',
        'googletagmanager.com',
        'www.google-analytics.com',
        'www.googletagmanager.com',
        'facebook.com',
        'connect.facebook.net',
        'www.facebook.com',
        '2o7.net',
        'omtrdc.net',
        'demdex.net',
        'everesttech.net',
        'hotjar.com',
        'fullstory.com',
        'logrocket.com',
        'mouseflow.com',
        'smartlook.com',
        'analytics.tiktok.com',
        'business-api.tiktok.com',
        'stats.wp.com',
        'scorecardresearch.com',
        'quantserve.com',
        'doubleclick.net',
        'googlesyndication.com',
        'analytics.twitter.com',
        'platform.twitter.com'
      ];
      
      let trackingDomain = domain;
      
      if (method === 'request' && typeof details === 'string') {
        try {
          const url = new URL(details);
          trackingDomain = url.hostname;
        } catch (error) {
          logger.log('warn', 'Failed to parse URL from request details', error, { details });
        }
      }
      
      const isThirdPartyTracker = THIRD_PARTY_TRACKING_DOMAINS.some(tracker => 
        trackingDomain === tracker || trackingDomain.endsWith('.' + tracker)
      );
      
      if (isThirdPartyTracker) {
        return {
          shouldBlock: true,
          addToBlocklist: true,
          targetDomain: trackingDomain,
          blockingMethod: 'network_level'
        };
      }
      
      const isSelfHostedGA = this.isSelfHostedGA(details, method);
      
      if (isSelfHostedGA && this.settings.blockSelfHosted) {
        return {
          shouldBlock: true,
          addToBlocklist: false,
          targetDomain: domain,
          blockingMethod: 'browser_only'
        };
      }
      
      if (this.settings.detectionSensitivity === 'low') {
        return {
          shouldBlock: false,
          addToBlocklist: false,
          targetDomain: domain,
          blockingMethod: 'none'
        };
      }
      
      return {
        shouldBlock: true,
        addToBlocklist: false,
        targetDomain: domain,
        blockingMethod: 'browser_only'
      };
      
    } catch (error) {
      logger.log('warn', 'Error determining blocking target', error, { domain, method });
      return {
        shouldBlock: false,
        addToBlocklist: false,
        targetDomain: domain,
        blockingMethod: 'none'
      };
    }
  }

  isSelfHostedGA(details, method) {
    try {
      if (method !== 'request' || typeof details !== 'string') {
        return false;
      }
      
      const SELF_HOSTED_PATTERNS = [
        /\/gtag\/js/,
        /\/gtm\.js/,
        /\/analytics\.js/,
        /\/ga\.js/,
        /\/collect\?/,
        /\/g\/collect\?/,
        /\/mp\/collect\?/
      ];
      
      return SELF_HOSTED_PATTERNS.some(pattern => pattern.test(details));
      
    } catch (error) {
      logger.log('warn', 'Error checking self-hosted GA', error, { details, method });
      return false;
    }
  }

  async deleteCookie(cookie) {
    try {
      if (!cookie || !cookie.name || !cookie.domain) {
        logger.log('warn', 'Invalid cookie for deletion', null, { cookie });
        return;
      }
      
      const url = 'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain + (cookie.path || '/');
      
      await withTimeout(
        browser.cookies.remove({
          url: url,
          name: cookie.name
        }),
        3000
      );
      
      this.cookiesDeleted++;
      logger.log('debug', 'Deleted tracking cookie', null, { 
        name: cookie.name, 
        domain: cookie.domain 
      });
      
    } catch (error) {
      logger.log('warn', 'Failed to delete cookie', error, { 
        cookieName: cookie?.name,
        cookieDomain: cookie?.domain
      });
    }
  }

  async cleanupCookies() {
    if (!this.isEnabled) return;
    
    try {
      const allCookies = await withTimeout(
        browser.cookies.getAll({}),
        5000
      );
      
      if (!Array.isArray(allCookies)) {
        logger.log('warn', 'Invalid cookies response from API');
        return;
      }
      
      let deletedCount = 0;
      for (const cookie of allCookies) {
        try {
          if (this.isTrackingCookie(cookie.name, cookie.value)) {
            await this.deleteCookie(cookie);
            deletedCount++;
            
            // Limit cleanup operations to prevent blocking
            if (deletedCount >= 10) {
              break;
            }
          }
        } catch (error) {
          logger.log('warn', 'Error processing cookie in cleanup', error, { 
            cookieName: cookie.name 
          });
        }
      }
      
      if (deletedCount > 0) {
        logger.log('debug', 'Cookie cleanup completed', null, { deletedCount });
      }
      
    } catch (error) {
      logger.log('error', 'Cookie cleanup failed', error);
    }
  }

  async manageBlocklist() {
    if (!this.settings.autoCleanup) return;
    
    try {
      const entries = Array.from(this.detectedDomains.entries());
      
      if (entries.length > this.settings.maxHostsEntries) {
        entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen);
        
        const toRemove = entries.slice(0, entries.length - this.settings.maxHostsEntries);
        toRemove.forEach(([domain]) => {
          this.detectedDomains.delete(domain);
        });
        
        logger.log('info', 'Removed old entries from blocklist', null, { 
          removedCount: toRemove.length 
        });
      }
      
      this.suggestExport();
      
    } catch (error) {
      logger.log('error', 'Error managing blocklist', error);
    }
  }

  suggestExport() {
    try {
      browser.runtime.sendMessage({
        type: 'EXPORT_SUGGESTED',
        domainCount: this.detectedDomains.size,
        threshold: this.settings.autoExportThreshold
      }).catch(() => {
        // Ignore errors if popup/options not open
      });
    } catch (error) {
      logger.log('debug', 'Could not suggest export (popup likely closed)');
    }
  }

  getStats() {
    try {
      const recentDomains = Array.from(this.detectedDomains.entries())
        .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
        .slice(0, 10);
      
      return {
        enabled: this.isEnabled,
        blockedToday: this.blockedToday || 0,
        cookiesDeleted: this.cookiesDeleted || 0,
        totalDomains: this.detectedDomains.size || 0,
        settings: this.settings,
        performance: this.performanceStats,
        recentDomains: recentDomains.map(([domain, data]) => ({
          domain,
          lastSeen: data.lastSeen || Date.now(),
          frequency: data.frequency || 1,
          types: data.gaTypes || ['unknown'],
          hostDomain: data.hostDomain || domain
        }))
      };
      
    } catch (error) {
      logger.log('error', 'Error generating stats', error);
      return {
        enabled: this.isEnabled,
        blockedToday: 0,
        cookiesDeleted: 0,
        totalDomains: 0,
        error: 'Failed to generate complete statistics'
      };
    }
  }

  async exportBlocklist(format) {
    try {
      const domains = Array.from(this.detectedDomains.keys())
        .filter(domain => typeof domain === 'string' && domain.length > 0)
        .sort();
        
      const timestamp = new Date().toISOString();
      
      switch (format) {
        case 'pihole':
          return {
            content: `# Nixxer Generated Blocklist (Enhanced)\n# Generated: ${timestamp}\n# Total domains: ${domains.length}\n# Multi-platform tracking protection\n# Extension performance: ${this.performanceStats.avgProcessingTime.toFixed(2)}ms avg\n\n${domains.join('\n')}`,
            filename: `nixxer-blocklist-${Date.now()}.txt`
          };
        
        case 'nextdns':
          return {
            content: JSON.stringify({
              name: 'Nixxer Multi-Platform Blocklist (Enhanced)',
              description: `Auto-generated comprehensive tracking protection - ${timestamp}`,
              version: '1.2.0',
              domains: domains,
              metadata: {
                totalDomains: domains.length,
                generatedAt: timestamp,
                trackerTypes: ['Google Analytics', 'Facebook', 'Adobe', 'Session Recording', 'TikTok'],
                performance: {
                  avgProcessingTime: `${this.performanceStats.avgProcessingTime.toFixed(3)}ms`,
                  requestsProcessed: this.performanceStats.requestsProcessed,
                  blockingRate: `${(this.performanceStats.requestsBlocked / Math.max(this.performanceStats.requestsProcessed, 1) * 100).toFixed(2)}%`
                }
              }
            }, null, 2),
            filename: `nixxer-blocklist-${Date.now()}.json`
          };
        
        case 'hosts':
          const hostsEntries = domains.map(domain => `0.0.0.0 ${domain}`).join('\n');
          return {
            content: `# Nixxer Generated Hosts File (Enhanced)\n# Generated: ${timestamp}\n# Total domains: ${domains.length}\n# Multi-platform tracking protection\n# Extension performance: ${this.performanceStats.avgProcessingTime.toFixed(2)}ms avg\n\n${hostsEntries}`,
            filename: `nixxer-hosts-${Date.now()}.txt`
          };
        
        case 'adguard':
          const adguardRules = domains.map(domain => `||${domain}^`).join('\n');
          return {
            content: `! Title: Nixxer Multi-Platform Tracking Rules (Enhanced)\n! Generated: ${timestamp}\n! Total domains: ${domains.length}\n! Extension version: 1.2.0\n! Performance: ${this.performanceStats.avgProcessingTime.toFixed(2)}ms avg\n\n${adguardRules}`,
            filename: `nixxer-adguard-${Date.now()}.txt`
          };
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
    } catch (error) {
      logger.log('error', 'Export failed', error, { format });
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  scheduleCleanup() {
    try {
      setInterval(() => {
        try {
          this.performScheduledCleanup();
        } catch (error) {
          logger.log('warn', 'Error in scheduled cleanup', error);
        }
      }, 24 * 60 * 60 * 1000);
      
      // Run initial cleanup
      setTimeout(() => {
        try {
          this.performScheduledCleanup();
        } catch (error) {
          logger.log('warn', 'Error in initial cleanup', error);
        }
      }, 5000);
      
    } catch (error) {
      logger.log('warn', 'Failed to schedule cleanup', error);
    }
  }

  async performScheduledCleanup() {
    try {
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let removedCount = 0;
      
      for (const [domain, data] of this.detectedDomains.entries()) {
        try {
          if (data.lastSeen < cutoff) {
            this.detectedDomains.delete(domain);
            removedCount++;
          }
        } catch (error) {
          logger.log('warn', 'Error processing domain in cleanup', error, { domain });
        }
      }
      
      if (removedCount > 0) {
        this.debouncedSave();
        logger.log('info', 'Scheduled cleanup completed', null, { removedCount });
      }
      
    } catch (error) {
      logger.log('error', 'Scheduled cleanup failed', error);
    }
  }
}

// Initialize Nixxer with global error handling
try {
  const nixxer = new NixxerCore();
  
  // Global error handler for unhandled errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logger.log('error', 'Unhandled error in background script', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      logger.log('error', 'Unhandled promise rejection in background script', event.reason);
    });
  }
  
} catch (error) {
  console.error('Critical: Failed to initialize Nixxer core:', error);
  
  // Try to report the critical initialization failure
  try {
    if (browser && browser.storage && browser.storage.local) {
      browser.storage.local.set({
        criticalInitError: {
          message: error.message,
          stack: error.stack,
          timestamp: Date.now()
        }
      });
    }
  } catch (storageError) {
    console.error('Could not even store initialization error:', storageError);
  }
}