// Nixxer Content Script - Balanced Performance Optimization

// Compiled regex patterns - cached for performance
const COMPILED_PATTERNS = {
  // Zombie storage patterns (essential ones only)
  zombie: [
    /_ga_backup/,
    /_gid_backup/,
    /analytics_backup/,
    /tracking_id/,
    /user_fingerprint/,
    /client_id_backup/,
    /visitor_id_/,
    /session_backup/
  ],
  
  // High-value tracker patterns (optimized regex)
  facebook: [
    /\bfbq\s*\(/,
    /facebook\.trackEvent/,
    /_fbq\.push/,
    /FB\.Event\.subscribe/
  ],
  
  adobe: [
    /\bs\.t\s*\(/,
    /\bs\.tl\s*\(/,
    /adobe_mc_/,
    /AppMeasurement/,
    /omniture/i
  ],
  
  sessionRecording: [
    /\bhj\s*\(/,
    /FS\.identify/,
    /LogRocket\.identify/,
    /_lr_\w+/,
    /smartlook\(/,
    /mouseflow\(/
  ],
  
  tiktok: [
    /ttq\.track/,
    /ttq\.page/,
    /tiktok_pixel/
  ],
  
  // Core GA patterns (most critical)
  googleAnalytics: [
    /\bgtag\s*\(/,
    /\bga\s*\(/,
    /dataLayer\.push\s*\(/,
    /google_tag_manager/,
    /GoogleAnalyticsObject/,
    /_gaq\.push/,
    /gtm\.start/
  ]
};

// Pre-compiled domain checks (string matching for performance)
const TRACKING_DOMAINS = new Set([
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

// Performance utilities
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Smart content scanner with size limits
function scanTextContent(content, maxSize = 15000) {
  if (!content || content.length === 0) return null;
  
  // Skip very large scripts to avoid performance issues
  if (content.length > maxSize) {
    // Sample first and last portions for large scripts
    const sample = content.slice(0, 5000) + content.slice(-5000);
    return sample;
  }
  
  return content;
}

class BalancedNixxerDetector {
  constructor() {
    this.detected = new Set();
    this.domain = window.location.hostname;
    this.scanCount = 0;
    this.maxScans = 30; // Limit total scanning operations
    
    if (this.shouldSkipDetection()) return;
    
    // Throttled reporting - balanced frequency
    this.throttledReport = throttle(this.reportDetection.bind(this), 1500);
    
    // Debounced zombie cleanup
    this.debouncedZombieCleanup = debounce(this.cleanupZombieStorage.bind(this), 3000);
    
    this.init();
  }

  shouldSkipDetection() {
    const skipDomains = ['localhost', '127.0.0.1'];
    const skipProtocols = ['chrome://', 'moz-extension://', 'chrome-extension://', 'file://'];
    const currentUrl = window.location.href.toLowerCase();
    
    return skipDomains.some(domain => currentUrl.includes(domain)) ||
           skipProtocols.some(protocol => currentUrl.startsWith(protocol)) ||
           /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(this.domain);
  }

  init() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        this.performBalancedDetection();
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        this.performBalancedDetection();
      }, 200);
    }
  }

  performBalancedDetection() {
    // 1. Quick global checks (high value, minimal cost)
    this.detectTrackerGlobals();
    
    // 2. Smart script scanning (optimized approach)
    this.smartScriptScan();
    
    // 3. Efficient observer setup
    this.setupOptimizedObserver();
    
    // 4. Periodic maintenance
    this.schedulePeriodicTasks();
    
    console.log('Nixxer balanced detector initialized');
  }

  detectTrackerGlobals() {
    const globals = ['gtag', 'ga', 'dataLayer', 'google_tag_manager', '_gaq', 'fbq', '_fbq', 's', 'hj', 'FS', 'LogRocket', 'ttq'];
    
    for (const global of globals) {
      if (typeof window[global] !== 'undefined') {
        this.throttledReport('global', `Global: ${global}`, this.domain);
        
        // Special dataLayer analysis
        if (global === 'dataLayer' && Array.isArray(window.dataLayer)) {
          this.analyzeDataLayer();
        }
        
        // Limit detections to avoid spam
        if (this.detected.size >= 5) break;
      }
    }
  }

  analyzeDataLayer() {
    if (!window.dataLayer || !Array.isArray(window.dataLayer)) return;
    
    this.throttledReport('dataLayer', `DataLayer with ${window.dataLayer.length} items`, this.domain);
    
    // Check first few items for GTM patterns (performance limited)
    const itemsToCheck = Math.min(window.dataLayer.length, 3);
    for (let i = 0; i < itemsToCheck; i++) {
      const item = window.dataLayer[i];
      if (item && typeof item === 'object') {
        if (item.event || item['gtm.start'] || item['gtm.uniqueEventId']) {
          this.throttledReport('dataLayer', `GTM event at index ${i}`, this.domain);
          break;
        }
      }
    }
  }

  smartScriptScan() {
    // Prioritized scanning: head scripts first, then body (limited)
    const headScripts = document.head?.querySelectorAll('script') || [];
    const bodyScripts = document.body?.querySelectorAll('script') || [];
    
    // Scan head scripts (most important)
    this.scanScriptCollection(Array.from(headScripts).slice(0, 15), 'head');
    
    // Scan limited body scripts
    this.scanScriptCollection(Array.from(bodyScripts).slice(0, 10), 'body');
  }

  scanScriptCollection(scripts, location) {
    for (const script of scripts) {
      if (this.scanCount >= this.maxScans) break;
      
      // Check external scripts
      if (script.src) {
        if (this.isTrackingScript(script.src)) {
          const domain = this.extractTrackingDomain(script.src);
          this.throttledReport('script', `${location} script: ${script.src}`, domain);
          this.scanCount++;
        }
      } 
      // Check inline scripts (with size limits)
      else {
        const content = scanTextContent(script.textContent || script.innerHTML);
        if (content) {
          this.scanInlineScript(content, location);
          this.scanCount++;
        }
      }
    }
  }

  scanInlineScript(content, location) {
    // Efficient pattern matching - test most common patterns first
    const patterns = [
      { name: 'Google Analytics', patterns: COMPILED_PATTERNS.googleAnalytics },
      { name: 'Facebook', patterns: COMPILED_PATTERNS.facebook },
      { name: 'Adobe', patterns: COMPILED_PATTERNS.adobe },
      { name: 'Session Recording', patterns: COMPILED_PATTERNS.sessionRecording },
      { name: 'TikTok', patterns: COMPILED_PATTERNS.tiktok }
    ];
    
    for (const { name, patterns: patternList } of patterns) {
      for (const pattern of patternList) {
        if (pattern.test(content)) {
          this.throttledReport('javascript', `${name} in ${location}`, this.domain);
          return; // Stop after first match to avoid redundant detections
        }
      }
    }
    
    // Check for GTM containers (specific pattern)
    const gtmMatches = content.match(/GTM-[A-Z0-9]{4,8}/);
    if (gtmMatches) {
      this.throttledReport('gtm', `Container: ${gtmMatches[0]}`, this.domain);
    }
    
    // Check for measurement protocol
    if (content.includes('/collect') || content.includes('/mp/collect')) {
      this.detectMeasurementProtocol(content);
    }
  }

  detectMeasurementProtocol(content) {
    const urlPattern = /https?:\/\/([^\/\s"']+)/g;
    const matches = content.match(urlPattern);
    
    if (matches) {
      const collectUrl = matches.find(url => url.includes('collect'));
      if (collectUrl) {
        const domain = this.extractTrackingDomain(collectUrl);
        this.throttledReport('measurement', `Measurement protocol: ${collectUrl}`, domain);
      }
    } else {
      this.throttledReport('measurement', 'Self-hosted measurement protocol', this.domain);
    }
  }

  isTrackingScript(src) {
    if (!src) return false;
    
    try {
      const hostname = new URL(src).hostname;
      return TRACKING_DOMAINS.has(hostname) || 
             Array.from(TRACKING_DOMAINS).some(domain => hostname.endsWith('.' + domain));
    } catch {
      // Fallback to string matching
      return Array.from(TRACKING_DOMAINS).some(domain => src.includes(domain));
    }
  }

  extractTrackingDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      const match = url.match(/https?:\/\/([^\/]+)/);
      return match ? match[1] : this.domain;
    }
  }

  setupOptimizedObserver() {
    // Optimized observer - watch for script additions only
    const observer = new MutationObserver(this.handleOptimizedMutations.bind(this));
    
    // Observe both head and body, but limit scope
    const observeOptions = {
      childList: true,
      subtree: true,
      attributeFilter: ['src'] // Only watch src attribute changes
    };
    
    if (document.head) {
      observer.observe(document.head, observeOptions);
    }
    
    if (document.body) {
      observer.observe(document.body, observeOptions);
    }
    
    // Auto-disconnect after reasonable time
    setTimeout(() => observer.disconnect(), 45000);
  }

  handleOptimizedMutations(mutations) {
    // Throttle mutation handling
    if (this.mutationThrottled) return;
    this.mutationThrottled = true;
    setTimeout(() => this.mutationThrottled = false, 2000);
    
    // Limit mutation processing
    const maxMutations = Math.min(mutations.length, 3);
    
    for (let i = 0; i < maxMutations; i++) {
      const mutation = mutations[i];
      
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
          this.processDynamicScript(node);
          return; // Process only first script to avoid spam
        }
      }
    }
  }

  processDynamicScript(script) {
    if (script.src && this.isTrackingScript(script.src)) {
      const domain = this.extractTrackingDomain(script.src);
      this.throttledReport('dynamic-script', `Dynamic: ${script.src}`, domain);
    } else if (!script.src) {
      // Process inline dynamic scripts (with limits)
      const content = scanTextContent(script.textContent || script.innerHTML, 5000);
      if (content) {
        this.scanInlineScript(content, 'dynamic');
      }
    }
  }

  schedulePeriodicTasks() {
    // Initial zombie cleanup
    setTimeout(() => this.debouncedZombieCleanup(), 2000);
    
    // Periodic cleanup (reduced frequency)
    setInterval(() => this.debouncedZombieCleanup(), 25000);
    
    // DataLayer monitoring setup
    this.setupDataLayerMonitoring();
  }

  setupDataLayerMonitoring() {
    if (!window.dataLayer || !Array.isArray(window.dataLayer)) return;
    
    const originalPush = window.dataLayer.push;
    const throttledHandler = throttle((item) => {
      if (item && typeof item === 'object') {
        this.throttledReport('dataLayer-push', 'DataLayer push detected', this.domain);
      }
    }, 2000);

    window.dataLayer.push = function(...args) {
      args.forEach(throttledHandler);
      return originalPush.apply(this, args);
    };
  }

  cleanupZombieStorage() {
    try {
      let cleanedCount = 0;
      const maxKeys = Math.min(localStorage.length, 30); // Reasonable limit
      
      for (let i = 0; i < maxKeys; i++) {
        const key = localStorage.key(i);
        if (key && COMPILED_PATTERNS.zombie.some(pattern => pattern.test(key))) {
          try {
            localStorage.removeItem(key);
            cleanedCount++;
            
            if (cleanedCount === 1) {
              this.throttledReport('zombie-storage', `Removed: ${key}`, this.domain);
            }
          } catch (e) {
            // Ignore removal errors
          }
        }
      }
    } catch (e) {
      // localStorage might not be accessible
    }
  }

  reportDetection(method, details, targetDomain = null) {
    const detectionKey = `${method}:${details}:${targetDomain || this.domain}`;
    
    if (this.detected.has(detectionKey)) return;
    
    this.detected.add(detectionKey);
    
    // Manage cache size
    if (this.detected.size > 25) {
      const oldKeys = Array.from(this.detected).slice(0, 10);
      oldKeys.forEach(key => this.detected.delete(key));
    }
    
    const domainToReport = targetDomain || this.domain;
    
    try {
      browser.runtime.sendMessage({
        type: 'GA_DETECTED',
        domain: domainToReport,
        method: method,
        details: details,
        timestamp: Date.now(),
        url: window.location.href,
        hostDomain: this.domain
      }).catch(() => {
        // Ignore messaging errors
      });
    } catch (e) {
      // Ignore messaging errors
    }
    
    if (console && console.log) {
      console.log(`Nixxer detected: ${method} - ${details} (${domainToReport})`);
    }
  }
}

// Optimized initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BalancedNixxerDetector();
  });
} else {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      new BalancedNixxerDetector();
    }, { timeout: 1500 });
  } else {
    setTimeout(() => {
      new BalancedNixxerDetector();
    }, 300);
  }
}