// Nixxer Content Script - Enhanced with Comprehensive Error Handling

// Enhanced error logging for content script
class ContentErrorLogger {
  constructor() {
    this.errorCounts = new Map();
    this.maxErrorsPerType = 3;
    this.debugMode = false;
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
      ...(error && { error: error.message })
    };
    
    // Log based on level and debug mode
    if (this.debugMode || level === 'error') {
      switch (level) {
        case 'debug':
          if (this.debugMode) console.debug('Nixxer Content Debug:', logData);
          break;
        case 'info':
          if (this.debugMode) console.info('Nixxer Content Info:', logData);
          break;
        case 'warn':
          console.warn('Nixxer Content Warning:', logData);
          break;
        case 'error':
          console.error('Nixxer Content Error:', logData);
          break;
      }
    }
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// Performance and safety utilities
function safeThrottle(func, limit) {
  let inThrottle;
  return function(...args) {
    try {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    } catch (error) {
      logger.log('warn', 'Error in throttled function', error);
    }
  };
}

function safeDebounce(func, delay) {
  let timeoutId;
  return function(...args) {
    try {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          func.apply(this, args);
        } catch (error) {
          logger.log('warn', 'Error in debounced function', error);
        }
      }, delay);
    } catch (error) {
      logger.log('warn', 'Error setting up debounce', error);
    }
  };
}

// Safe content scanning with validation
function safeScanTextContent(content, maxSize = 15000) {
  try {
    if (!content || typeof content !== 'string' || content.length === 0) {
      return null;
    }
    
    // Skip extremely large scripts to prevent memory issues
    if (content.length > maxSize) {
      const sample = content.slice(0, 5000) + content.slice(-5000);
      return sample;
    }
    
    return content;
    
  } catch (error) {
    logger.log('warn', 'Error scanning text content', error, { contentLength: content?.length });
    return null;
  }
}

// Enhanced pattern validation
function validatePatterns(patterns) {
  try {
    if (!Array.isArray(patterns)) {
      return [];
    }
    
    return patterns.filter(pattern => {
      try {
        if (pattern instanceof RegExp) {
          // Test the regex with a simple string to ensure it's valid
          pattern.test('test');
          return true;
        }
        return false;
      } catch (error) {
        logger.log('warn', 'Invalid regex pattern detected', error);
        return false;
      }
    });
    
  } catch (error) {
    logger.log('error', 'Error validating patterns', error);
    return [];
  }
}

// Safe compiled regex patterns with validation
const COMPILED_PATTERNS = {
  zombie: validatePatterns([
    /_ga_backup/,
    /_gid_backup/,
    /analytics_backup/,
    /tracking_id/,
    /user_fingerprint/,
    /client_id_backup/,
    /visitor_id_/,
    /session_backup/
  ]),
  
  facebook: validatePatterns([
    /\bfbq\s*\(/,
    /facebook\.trackEvent/,
    /_fbq\.push/,
    /FB\.Event\.subscribe/
  ]),
  
  adobe: validatePatterns([
    /\bs\.t\s*\(/,
    /\bs\.tl\s*\(/,
    /adobe_mc_/,
    /AppMeasurement/,
    /omniture/i
  ]),
  
  sessionRecording: validatePatterns([
    /\bhj\s*\(/,
    /FS\.identify/,
    /LogRocket\.identify/,
    /_lr_\w+/,
    /smartlook\(/,
    /mouseflow\(/
  ]),
  
  tiktok: validatePatterns([
    /ttq\.track/,
    /ttq\.page/,
    /tiktok_pixel/
  ]),
  
  googleAnalytics: validatePatterns([
    /\bgtag\s*\(/,
    /\bga\s*\(/,
    /dataLayer\.push\s*\(/,
    /google_tag_manager/,
    /GoogleAnalyticsObject/,
    /_gaq\.push/,
    /gtm\.start/
  ])
};

// Safe domain validation
function validateTrackingDomains(domains) {
  try {
    if (!Array.isArray(domains) && !(domains instanceof Set)) {
      return new Set();
    }
    
    const validDomains = new Set();
    const domainArray = Array.isArray(domains) ? domains : Array.from(domains);
    
    for (const domain of domainArray) {
      try {
        if (typeof domain === 'string' && domain.length > 0 && domain.length < 254) {
          validDomains.add(domain.toLowerCase().trim());
        }
      } catch (error) {
        logger.log('warn', 'Invalid domain in tracking domains list', error, { domain });
      }
    }
    
    return validDomains;
    
  } catch (error) {
    logger.log('error', 'Error validating tracking domains', error);
    return new Set();
  }
}

const TRACKING_DOMAINS = validateTrackingDomains([
  'google-analytics.com',
  'googletagmanager.com',
  'connect.facebook.net',
  'facebook.com',
  'hotjar.com',
  'fullstory.com',
  'logrocket.com',
  'mouseflow.com',
  'smartlook.com',
  'analytics.tiktok.com',
  'business-api.tiktok.com',
  '2o7.net',
  'omtrdc.net',
  'demdex.net',
  'everesttech.net'
]);

// Initialize logger
const logger = new ContentErrorLogger();

class SafeNixxerDetector {
  constructor() {
    this.detected = new Set();
    this.domain = '';
    this.scanCount = 0;
    this.maxScans = 30;
    this.initialized = false;
    this.initializationError = null;
    
    // Safe domain extraction
    try {
      this.domain = window.location.hostname || '';
    } catch (error) {
      logger.log('error', 'Failed to get hostname', error);
      this.domain = 'unknown';
    }
    
    if (this.shouldSkipDetection()) {
      logger.log('debug', 'Skipping detection for this domain', null, { domain: this.domain });
      return;
    }
    
    try {
      // Create throttled and debounced functions with error handling
      this.throttledReport = safeThrottle(this.reportDetection.bind(this), 1500);
      this.debouncedZombieCleanup = safeDebounce(this.cleanupZombieStorage.bind(this), 3000);
      
      this.init();
      
    } catch (error) {
      this.initializationError = error;
      logger.log('error', 'Failed to initialize detector', error);
    }
  }

  shouldSkipDetection() {
    try {
      const skipDomains = ['localhost', '127.0.0.1'];
      const skipProtocols = ['chrome://', 'moz-extension://', 'chrome-extension://', 'file://'];
      
      let currentUrl = '';
      try {
        currentUrl = window.location.href.toLowerCase();
      } catch (error) {
        logger.log('warn', 'Could not get current URL', error);
        return true; // Skip if we can't even get the URL
      }
      
      const shouldSkip = skipDomains.some(domain => currentUrl.includes(domain)) ||
                        skipProtocols.some(protocol => currentUrl.startsWith(protocol)) ||
                        /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(this.domain);
      
      return shouldSkip;
      
    } catch (error) {
      logger.log('warn', 'Error checking if should skip detection', error);
      return true; // Skip on error for safety
    }
  }

  init() {
    try {
      // Use requestIdleCallback for better performance if available
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          this.performSafeDetection();
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          this.performSafeDetection();
        }, 200);
      }
      
    } catch (error) {
      logger.log('error', 'Error in init', error);
      // Try fallback initialization
      setTimeout(() => {
        try {
          this.performSafeDetection();
        } catch (fallbackError) {
          logger.log('error', 'Fallback initialization also failed', fallbackError);
        }
      }, 1000);
    }
  }

  performSafeDetection() {
    try {
      logger.log('debug', 'Starting safe detection', null, { domain: this.domain });
      
      // 1. Safe global checks
      this.safeDetectTrackerGlobals();
      
      // 2. Safe script scanning
      this.safeScriptScan();
      
      // 3. Safe observer setup
      this.setupSafeObserver();
      
      // 4. Safe periodic tasks
      this.scheduleSafeTasks();
      
      this.initialized = true;
      logger.log('info', 'Safe detector initialized successfully');
      
    } catch (error) {
      logger.log('error', 'Error in safe detection', error);
      this.initializationError = error;
    }
  }

  safeDetectTrackerGlobals() {
    try {
      const globals = ['gtag', 'ga', 'dataLayer', 'google_tag_manager', '_gaq', 'fbq', '_fbq', 's', 'hj', 'FS', 'LogRocket', 'ttq'];
      
      for (const global of globals) {
        try {
          if (typeof window !== 'undefined' && typeof window[global] !== 'undefined') {
            this.safeReport('global', `Global: ${global}`, this.domain);
            
            // Special dataLayer analysis with error handling
            if (global === 'dataLayer') {
              this.safeAnalyzeDataLayer();
            }
            
            // Limit detections to avoid spam
            if (this.detected.size >= 5) break;
          }
        } catch (error) {
          logger.log('warn', `Error checking global ${global}`, error);
        }
      }
      
    } catch (error) {
      logger.log('error', 'Error detecting tracker globals', error);
    }
  }

  safeAnalyzeDataLayer() {
    try {
      if (typeof window === 'undefined' || 
          !window.dataLayer || 
          !Array.isArray(window.dataLayer)) {
        return;
      }
      
      this.safeReport('dataLayer', `DataLayer with ${window.dataLayer.length} items`, this.domain);
      
      // Check first few items for GTM patterns (performance limited)
      const itemsToCheck = Math.min(window.dataLayer.length, 3);
      for (let i = 0; i < itemsToCheck; i++) {
        try {
          const item = window.dataLayer[i];
          if (item && typeof item === 'object') {
            if (item.event || item['gtm.start'] || item['gtm.uniqueEventId']) {
              this.safeReport('dataLayer', `GTM event at index ${i}`, this.domain);
              break;
            }
          }
        } catch (error) {
          logger.log('warn', `Error analyzing dataLayer item ${i}`, error);
        }
      }
      
    } catch (error) {
      logger.log('warn', 'Error analyzing dataLayer', error);
    }
  }

  safeScriptScan() {
    try {
      // Safe script collection with error handling
      let headScripts = [];
      let bodyScripts = [];
      
      try {
        if (document.head) {
          headScripts = Array.from(document.head.querySelectorAll('script') || []);
        }
      } catch (error) {
        logger.log('warn', 'Error getting head scripts', error);
      }
      
      try {
        if (document.body) {
          bodyScripts = Array.from(document.body.querySelectorAll('script') || []);
        }
      } catch (error) {
        logger.log('warn', 'Error getting body scripts', error);
      }
      
      // Scan scripts with limits and error handling
      this.safeScanScriptCollection(headScripts.slice(0, 15), 'head');
      this.safeScanScriptCollection(bodyScripts.slice(0, 10), 'body');
      
    } catch (error) {
      logger.log('error', 'Error in script scanning', error);
    }
  }

  safeScanScriptCollection(scripts, location) {
    try {
      if (!Array.isArray(scripts)) {
        logger.log('warn', 'Invalid scripts array provided', null, { location });
        return;
      }
      
      for (const script of scripts) {
        if (this.scanCount >= this.maxScans) break;
        
        try {
          // Check external scripts
          if (script.src) {
            if (this.safeIsTrackingScript(script.src)) {
              const domain = this.safeExtractTrackingDomain(script.src);
              this.safeReport('script', `${location} script: ${script.src}`, domain);
              this.scanCount++;
            }
          } 
          // Check inline scripts with size limits
          else {
            const content = safeScanTextContent(script.textContent || script.innerHTML);
            if (content) {
              this.safeScanInlineScript(content, location);
              this.scanCount++;
            }
          }
        } catch (error) {
          logger.log('warn', `Error scanning script in ${location}`, error);
        }
      }
      
    } catch (error) {
      logger.log('error', 'Error scanning script collection', error, { location });
    }
  }

  safeScanInlineScript(content, location) {
    try {
      if (!content || typeof content !== 'string') {
        return;
      }
      
      // Efficient pattern matching with error handling
      const patterns = [
        { name: 'Google Analytics', patterns: COMPILED_PATTERNS.googleAnalytics },
        { name: 'Facebook', patterns: COMPILED_PATTERNS.facebook },
        { name: 'Adobe', patterns: COMPILED_PATTERNS.adobe },
        { name: 'Session Recording', patterns: COMPILED_PATTERNS.sessionRecording },
        { name: 'TikTok', patterns: COMPILED_PATTERNS.tiktok }
      ];
      
      for (const { name, patterns: patternList } of patterns) {
        try {
          for (const pattern of patternList) {
            try {
              if (pattern.test(content)) {
                this.safeReport('javascript', `${name} in ${location}`, this.domain);
                return; // Stop after first match
              }
            } catch (error) {
              logger.log('warn', `Error testing pattern for ${name}`, error);
            }
          }
        } catch (error) {
          logger.log('warn', `Error processing patterns for ${name}`, error);
        }
      }
      
      // Safe GTM container detection
      try {
        const gtmMatches = content.match(/GTM-[A-Z0-9]{4,8}/);
        if (gtmMatches) {
          this.safeReport('gtm', `Container: ${gtmMatches[0]}`, this.domain);
        }
      } catch (error) {
        logger.log('warn', 'Error detecting GTM containers', error);
      }
      
      // Safe measurement protocol detection
      try {
        if (content.includes('/collect') || content.includes('/mp/collect')) {
          this.safeDetectMeasurementProtocol(content);
        }
      } catch (error) {
        logger.log('warn', 'Error detecting measurement protocol', error);
      }
      
    } catch (error) {
      logger.log('error', 'Error scanning inline script', error, { location });
    }
  }

  safeDetectMeasurementProtocol(content) {
    try {
      const urlPattern = /https?:\/\/([^\/\s"']+)/g;
      const matches = content.match(urlPattern);
      
      if (matches && Array.isArray(matches)) {
        try {
          const collectUrl = matches.find(url => url.includes('collect'));
          if (collectUrl) {
            const domain = this.safeExtractTrackingDomain(collectUrl);
            this.safeReport('measurement', `Measurement protocol: ${collectUrl}`, domain);
          }
        } catch (error) {
          logger.log('warn', 'Error processing collect URL', error);
        }
      } else {
        this.safeReport('measurement', 'Self-hosted measurement protocol', this.domain);
      }
      
    } catch (error) {
      logger.log('warn', 'Error in measurement protocol detection', error);
    }
  }

  safeIsTrackingScript(src) {
    try {
      if (!src || typeof src !== 'string') {
        return false;
      }
      
      try {
        const url = new URL(src);
        const hostname = url.hostname.toLowerCase();
        return TRACKING_DOMAINS.has(hostname) || 
               Array.from(TRACKING_DOMAINS).some(domain => hostname.endsWith('.' + domain));
      } catch (urlError) {
        // Fallback to string matching if URL parsing fails
        return Array.from(TRACKING_DOMAINS).some(domain => 
          src.toLowerCase().includes(domain.toLowerCase())
        );
      }
      
    } catch (error) {
      logger.log('warn', 'Error checking tracking script', error, { src });
      return false;
    }
  }

  safeExtractTrackingDomain(url) {
    try {
      if (!url || typeof url !== 'string') {
        return this.domain;
      }
      
      try {
        return new URL(url).hostname;
      } catch (urlError) {
        // Fallback to regex extraction
        const match = url.match(/https?:\/\/([^\/]+)/);
        return match ? match[1] : this.domain;
      }
      
    } catch (error) {
      logger.log('warn', 'Error extracting tracking domain', error, { url });
      return this.domain;
    }
  }

  setupSafeObserver() {
    try {
      if (typeof MutationObserver === 'undefined') {
        logger.log('warn', 'MutationObserver not available');
        return;
      }
      
      const observer = new MutationObserver((mutations) => {
        try {
          this.handleSafeMutations(mutations);
        } catch (error) {
          logger.log('error', 'Error in mutation observer', error);
        }
      });
      
      const observeOptions = {
        childList: true,
        subtree: true,
        attributeFilter: ['src']
      };
      
      // Safe observer setup
      try {
        if (document.head) {
          observer.observe(document.head, observeOptions);
        }
      } catch (error) {
        logger.log('warn', 'Error observing document.head', error);
      }
      
      try {
        if (document.body) {
          observer.observe(document.body, observeOptions);
        }
      } catch (error) {
        logger.log('warn', 'Error observing document.body', error);
      }
      
      // Auto-disconnect with error handling
      setTimeout(() => {
        try {
          observer.disconnect();
        } catch (error) {
          logger.log('warn', 'Error disconnecting observer', error);
        }
      }, 45000);
      
    } catch (error) {
      logger.log('error', 'Error setting up mutation observer', error);
    }
  }

  handleSafeMutations(mutations) {
    try {
      // Throttle mutation handling
      if (this.mutationThrottled) return;
      this.mutationThrottled = true;
      setTimeout(() => this.mutationThrottled = false, 2000);
      
      if (!Array.isArray(mutations)) {
        logger.log('warn', 'Invalid mutations array');
        return;
      }
      
      // Limit mutation processing
      const maxMutations = Math.min(mutations.length, 3);
      
      for (let i = 0; i < maxMutations; i++) {
        try {
          const mutation = mutations[i];
          
          if (mutation && mutation.addedNodes) {
            for (const node of mutation.addedNodes) {
              try {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
                  this.safProcessDynamicScript(node);
                  return; // Process only first script
                }
              } catch (error) {
                logger.log('warn', 'Error processing added node', error);
              }
            }
          }
        } catch (error) {
          logger.log('warn', 'Error processing mutation', error);
        }
      }
      
    } catch (error) {
      logger.log('error', 'Error handling mutations', error);
    }
  }

  safProcessDynamicScript(script) {
    try {
      if (!script) return;
      
      if (script.src && this.safeIsTrackingScript(script.src)) {
        const domain = this.safeExtractTrackingDomain(script.src);
        this.safeReport('dynamic-script', `Dynamic: ${script.src}`, domain);
      } else if (!script.src) {
        // Process inline dynamic scripts with limits
        const content = safeScanTextContent(script.textContent || script.innerHTML, 5000);
        if (content) {
          this.safeScanInlineScript(content, 'dynamic');
        }
      }
      
    } catch (error) {
      logger.log('warn', 'Error processing dynamic script', error);
    }
  }

  scheduleSafeTasks() {
    try {
      // Initial zombie cleanup with delay and error handling
      setTimeout(() => {
        try {
          this.debouncedZombieCleanup();
        } catch (error) {
          logger.log('warn', 'Error in initial zombie cleanup', error);
        }
      }, 2000);
      
      // Periodic cleanup with error handling
      setInterval(() => {
        try {
          this.debouncedZombieCleanup();
        } catch (error) {
          logger.log('warn', 'Error in periodic zombie cleanup', error);
        }
      }, 25000);
      
      // Safe DataLayer monitoring setup
      this.setupSafeDataLayerMonitoring();
      
    } catch (error) {
      logger.log('error', 'Error scheduling safe tasks', error);
    }
  }

  setupSafeDataLayerMonitoring() {
    try {
      if (typeof window === 'undefined' || 
          !window.dataLayer || 
          !Array.isArray(window.dataLayer)) {
        return;
      }
      
      const originalPush = window.dataLayer.push;
      if (typeof originalPush !== 'function') {
        logger.log('warn', 'DataLayer push is not a function');
        return;
      }
      
      const throttledHandler = safeThrottle((item) => {
        try {
          if (item && typeof item === 'object') {
            this.safeReport('dataLayer-push', 'DataLayer push detected', this.domain);
          }
        } catch (error) {
          logger.log('warn', 'Error in dataLayer push handler', error);
        }
      }, 2000);

      window.dataLayer.push = function(...args) {
        try {
          args.forEach(throttledHandler);
          return originalPush.apply(this, args);
        } catch (error) {
          logger.log('warn', 'Error in dataLayer push override', error);
          // Fallback to original function
          return originalPush.apply(this, args);
        }
      };
      
    } catch (error) {
      logger.log('error', 'Error setting up dataLayer monitoring', error);
    }
  }

  cleanupZombieStorage() {
    try {
      if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
        logger.log('debug', 'localStorage not available');
        return;
      }
      
      let cleanedCount = 0;
      const maxKeys = Math.min(localStorage.length, 30);
      
      for (let i = 0; i < maxKeys; i++) {
        try {
          const key = localStorage.key(i);
          if (key && typeof key === 'string') {
            
            // Safe pattern matching
            let isZombieKey = false;
            for (const pattern of COMPILED_PATTERNS.zombie) {
              try {
                if (pattern.test(key)) {
                  isZombieKey = true;
                  break;
                }
              } catch (error) {
                logger.log('warn', 'Error testing zombie pattern', error);
              }
            }
            
            if (isZombieKey) {
              try {
                localStorage.removeItem(key);
                cleanedCount++;
                
                if (cleanedCount === 1) {
                  this.safeReport('zombie-storage', `Removed: ${key}`, this.domain);
                }
              } catch (removalError) {
                logger.log('warn', 'Failed to remove zombie storage item', removalError, { key });
              }
            }
          }
        } catch (error) {
          logger.log('warn', 'Error processing localStorage key', error);
        }
      }
      
      if (cleanedCount > 0) {
        logger.log('debug', 'Zombie storage cleanup completed', null, { cleanedCount });
      }
      
    } catch (error) {
      logger.log('warn', 'localStorage cleanup failed', error);
    }
  }

  safeReport(method, details, targetDomain = null) {
    try {
      if (!method || !details) {
        logger.log('warn', 'Invalid report parameters', null, { method, details });
        return;
      }
      
      const detectionKey = `${method}:${details}:${targetDomain || this.domain}`;
      
      if (this.detected.has(detectionKey)) {
        return; // Already reported
      }
      
      this.detected.add(detectionKey);
      
      // Manage cache size to prevent memory issues
      if (this.detected.size > 25) {
        const oldKeys = Array.from(this.detected).slice(0, 10);
        oldKeys.forEach(key => this.detected.delete(key));
      }
      
      const domainToReport = targetDomain || this.domain;
      
      // Safe message sending with error handling
      this.sendSafeMessage({
        type: 'GA_DETECTED',
        domain: domainToReport,
        method: method,
        details: details,
        timestamp: Date.now(),
        url: this.getCurrentUrl(),
        hostDomain: this.domain
      });
      
      logger.log('debug', 'Detection reported', null, { 
        method, 
        details, 
        domain: domainToReport 
      });
      
    } catch (error) {
      logger.log('error', 'Error in safe report', error, { method, details });
    }
  }

  getCurrentUrl() {
    try {
      return window.location.href;
    } catch (error) {
      logger.log('warn', 'Could not get current URL', error);
      return 'unknown';
    }
  }

  sendSafeMessage(message) {
    try {
      if (typeof browser === 'undefined' || !browser.runtime) {
        logger.log('debug', 'Browser runtime not available');
        return;
      }
      
      // Add timeout to prevent hanging
      const messagePromise = browser.runtime.sendMessage(message);
      
      if (messagePromise && typeof messagePromise.catch === 'function') {
        messagePromise.catch((error) => {
          // Don't log every messaging error as it's common when popup is closed
          logger.log('debug', 'Message sending failed (likely normal)', null, { 
            messageType: message.type 
          });
        });
      }
      
    } catch (error) {
      logger.log('debug', 'Error sending message', error, { messageType: message?.type });
    }
  }

  reportDetection(method, details, targetDomain = null) {
    // Maintain backward compatibility
    this.safeReport(method, details, targetDomain);
  }
}

// Safe initialization with comprehensive error handling
function safeInitializeDetector() {
  try {
    // Check if we're in a valid browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      logger.log('warn', 'Not in browser environment, skipping initialization');
      return;
    }
    
    // Initialize detector
    new SafeNixxerDetector();
    
  } catch (error) {
    logger.log('error', 'Critical error initializing detector', error);
    
    // Try minimal fallback initialization
    try {
      setTimeout(() => {
        try {
          logger.log('info', 'Attempting fallback initialization');
          // Minimal detector with just global checks
          const globals = ['gtag', 'ga', 'dataLayer', 'fbq', 'hj'];
          for (const global of globals) {
            try {
              if (typeof window !== 'undefined' && typeof window[global] !== 'undefined') {
                logger.log('info', `Fallback detected: ${global}`);
              }
            } catch (globalError) {
              // Ignore individual global check errors
            }
          }
        } catch (fallbackError) {
          logger.log('error', 'Even fallback initialization failed', fallbackError);
        }
      }, 2000);
    } catch (timeoutError) {
      logger.log('error', 'Could not even set fallback timeout', timeoutError);
    }
  }
}

// Enhanced initialization with multiple strategies
try {
  if (document.readyState === 'loading') {
    // Document still loading
    document.addEventListener('DOMContentLoaded', () => {
      try {
        safeInitializeDetector();
      } catch (error) {
        logger.log('error', 'Error in DOMContentLoaded handler', error);
      }
    });
    
    // Fallback in case DOMContentLoaded doesn't fire
    setTimeout(() => {
      try {
        if (document.readyState !== 'loading') {
          safeInitializeDetector();
        }
      } catch (error) {
        logger.log('error', 'Error in fallback initialization', error);
      }
    }, 3000);
    
  } else {
    // Document already loaded
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        safeInitializeDetector();
      }, { timeout: 1500 });
    } else {
      setTimeout(() => {
        safeInitializeDetector();
      }, 300);
    }
  }
  
} catch (error) {
  logger.log('error', 'Critical error in initialization setup', error);
  
  // Last resort: direct initialization
  try {
    setTimeout(() => {
      safeInitializeDetector();
    }, 5000);
  } catch (lastResortError) {
    console.error('Nixxer: Complete initialization failure', lastResortError);
  }
}

// Global error handlers for the content script
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && 
          event.error.message.includes('Nixxer')) {
        logger.log('error', 'Unhandled error in content script', event.error);
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && typeof event.reason === 'object' && 
          event.reason.message && event.reason.message.includes('Nixxer')) {
        logger.log('error', 'Unhandled promise rejection in content script', event.reason);
      }
    });
  } catch (error) {
    console.error('Could not set up global error handlers:', error);
  }
}