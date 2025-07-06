// Nixxer Content Script - Step 2: Performance Optimized

// Zombie cookie storage patterns
const ZOMBIE_STORAGE_PATTERNS = [
  /_ga_backup/,
  /_gid_backup/,
  /analytics_backup/,
  /tracking_id/,
  /user_fingerprint/,
  /client_id_backup/,
  /visitor_id_/,
  /session_backup/
];

// Enhanced tracker script patterns
const ENHANCED_TRACKER_PATTERNS = {
  facebook: [
    /fbq\s*\(/,
    /facebook\.trackEvent/,
    /_fbq\.push/,
    /FB\.Event\.subscribe/,
    /connect\.facebook\.net/
  ],
  
  adobe: [
    /s\.t\s*\(/,
    /s\.tl\s*\(/,
    /adobe_mc_/,
    /AppMeasurement/,
    /s_code\.js/,
    /omniture/i
  ],
  
  sessionRecording: [
    /hj\s*\(/,
    /FS\.identify/,
    /LogRocket\.identify/,
    /_lr_\w+/,
    /smartlook\(/,
    /mouseflow\(/,
    /hotjar/i
  ],
  
  tiktok: [
    /ttq\.track/,
    /ttq\.page/,
    /tiktok_pixel/,
    /analytics\.tiktok/
  ]
};

// OPTIMIZATION: Throttle function to limit detection frequency
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

class NixxerContentDetector {
  constructor() {
    this.detected = new Set();
    this.domain = window.location.hostname;
    
    // OPTIMIZATION: Skip detection on certain domains/pages
    if (this.shouldSkipDetection()) {
      return;
    }
    
    // OPTIMIZATION: Throttle message sending to background script
    this.throttledReport = throttle(this.reportDetection.bind(this), 1000);
    
    this.init();
  }

  // OPTIMIZATION: Skip detection on internal pages and development environments
  shouldSkipDetection() {
    const skipDomains = [
      'localhost',
      '127.0.0.1',
      'about:',
      'chrome://',
      'moz-extension://',
      'chrome-extension://',
      'chrome-devtools://',
      'devtools://'
    ];
    
    const currentUrl = window.location.href.toLowerCase();
    
    // Skip if URL matches any skip pattern
    if (skipDomains.some(domain => currentUrl.includes(domain))) {
      return true;
    }
    
    // Skip if domain is private/local IP range
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(this.domain)) {
      return true;
    }
    
    // Skip file:// URLs
    if (currentUrl.startsWith('file://')) {
      return true;
    }
    
    return false;
  }

  init() {
    // OPTIMIZATION: Use requestIdleCallback for non-critical initialization
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        this.performInitialization();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.performInitialization();
      }, 100);
    }
  }

  performInitialization() {
    // Detect existing tracking
    this.detectExistingGA();
    
    // Set up observers with optimized settings
    this.setupOptimizedObservers();
    
    console.log('Nixxer content detector initialized with performance optimizations');
  }

  detectExistingGA() {
    // Check for existing GA/GTM scripts
    this.scanScripts();
    
    // Check for GA functions in global scope
    this.scanGlobalFunctions();
    
    // Check for dataLayer
    this.scanDataLayer();
    
    // Check for GA cookies (lightweight)
    this.scanCookies();
    
    // OPTIMIZATION: Defer zombie cookie scanning to avoid blocking main thread
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        this.scanForZombieCookies();
      });
    } else {
      setTimeout(() => {
        this.scanForZombieCookies();
      }, 2000);
    }
  }

  scanScripts() {
    const scripts = document.querySelectorAll('script[src]'); // Only check scripts with src first
    
    scripts.forEach(script => {
      const src = script.src;
      
      if (src && this.isTrackingScript(src)) {
        const trackingDomain = this.extractTrackingDomain(src);
        this.throttledReport('script', `Script source: ${src}`, trackingDomain);
      }
    });
    
    // OPTIMIZATION: Limit inline script content scanning to first 50 scripts
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).slice(0, 50);
    
    inlineScripts.forEach(script => {
      const content = script.textContent || script.innerHTML;
      if (content && content.length > 0) {
        this.scanScriptContent(content);
      }
    });
  }

  scanScriptContent(content) {
    // OPTIMIZATION: Skip very large scripts to avoid performance issues
    if (content.length > 50000) { // Skip scripts larger than 50KB
      return;
    }
    
    // Your existing GA patterns...
    const gaPatterns = [
      /gtag\s*\(/,
      /ga\s*\(/,
      /dataLayer\.push\s*\(/,
      /google_tag_manager/,
      /GoogleAnalyticsObject/,
      /_gaq\.push/,
      /gtm\.start/
    ];
    
    // Add new tracker patterns
    const allPatterns = [
      ...gaPatterns,
      ...ENHANCED_TRACKER_PATTERNS.facebook,
      ...ENHANCED_TRACKER_PATTERNS.adobe,
      ...ENHANCED_TRACKER_PATTERNS.sessionRecording,
      ...ENHANCED_TRACKER_PATTERNS.tiktok
    ];
    
    // OPTIMIZATION: Test patterns efficiently - stop after first match
    for (let i = 0; i < allPatterns.length; i++) {
      const pattern = allPatterns[i];
      if (pattern.test(content)) {
        const trackerType = this.getTrackerType(pattern);
        this.throttledReport('javascript', `${trackerType} pattern detected`, this.domain);
        break; // Stop after first match to avoid redundant detections
      }
    }
    
    // Check for GTM containers
    const gtmMatches = content.match(/GTM-[A-Z0-9]{4,8}/g);
    if (gtmMatches) {
      this.throttledReport('gtm', `Container: ${gtmMatches[0]}`, this.domain); // Only report first match
    }
    
    // Check for measurement protocol in script content
    if (content.includes('/collect') || content.includes('/mp/collect')) {
      const urlMatches = content.match(/https?:\/\/([^\/\s"']+)/g);
      if (urlMatches && urlMatches.length > 0) {
        const collectUrl = urlMatches.find(url => url.includes('collect'));
        if (collectUrl) {
          const trackingDomain = this.extractTrackingDomain(collectUrl);
          this.throttledReport('measurement', `Measurement protocol: ${collectUrl}`, trackingDomain);
        }
      } else {
        this.throttledReport('measurement', 'Self-hosted measurement protocol detected', this.domain);
      }
    }
  }

  getTrackerType(pattern) {
    const patternStr = pattern.toString();
    if (/fbq|facebook/.test(patternStr)) return 'Facebook';
    if (/adobe|AppMeasurement|s\.t/.test(patternStr)) return 'Adobe';
    if (/hj|FS\.|LogRocket|smartlook|mouseflow/.test(patternStr)) return 'Session Recording';
    if (/ttq|tiktok/.test(patternStr)) return 'TikTok';
    return 'Google Analytics';
  }

  scanForZombieCookies() {
    // OPTIMIZATION: Wrap in try-catch and limit scope
    try {
      // Check LocalStorage with limited iterations
      const maxKeys = Math.min(localStorage.length, 50); // Limit to 50 keys
      for (let i = 0; i < maxKeys; i++) {
        const key = localStorage.key(i);
        if (key && ZOMBIE_STORAGE_PATTERNS.some(pattern => pattern.test(key))) {
          this.throttledReport('zombie-storage', `LocalStorage key: ${key}`, this.domain);
          // Optionally remove the zombie storage
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // localStorage might not be accessible in some contexts
      console.warn('LocalStorage scan failed:', error);
    }
  }

  scanGlobalFunctions() {
    const gaFunctions = ['gtag', 'ga', 'dataLayer', 'google_tag_manager', '_gaq'];
    
    gaFunctions.forEach(func => {
      if (typeof window[func] !== 'undefined') {
        this.throttledReport('global', `Global function: ${func}`, this.domain);
      }
    });
  }

  scanDataLayer() {
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      this.throttledReport('dataLayer', `DataLayer with ${window.dataLayer.length} items`, this.domain);
      
      // OPTIMIZATION: Only analyze first few dataLayer items
      const itemsToAnalyze = Math.min(window.dataLayer.length, 5);
      for (let i = 0; i < itemsToAnalyze; i++) {
        const item = window.dataLayer[i];
        if (item && typeof item === 'object') {
          if (item.event || item['gtm.start'] || item['gtm.uniqueEventId']) {
            this.throttledReport('dataLayer', `GTM event at index ${i}`, this.domain);
            break; // Stop after first GTM event found
          }
        }
      }
    }
  }

  scanCookies() {
    // OPTIMIZATION: Use document.cookie only once and cache result
    const cookieString = document.cookie;
    if (!cookieString) return;
    
    const cookies = cookieString.split(';');
    const gaCookiePatterns = [
      /^_ga=/,
      /^_gid=/,
      /^_gat/,
      /^_gtag_/,
      /^__utm/,
      /^_gcl_/,
      /^_gac_/,
      /^_dc_gtm_/,
      /^_fbc=/,
      /^_fbp=/
    ];
    
    // OPTIMIZATION: Limit cookie checking to first 30 cookies
    const cookiesToCheck = cookies.slice(0, 30);
    
    cookiesToCheck.forEach(cookie => {
      const trimmed = cookie.trim();
      for (let i = 0; i < gaCookiePatterns.length; i++) {
        if (gaCookiePatterns[i].test(trimmed)) {
          this.throttledReport('cookie', `Cookie: ${trimmed.split('=')[0]}`, this.domain);
          break; // Stop after first match
        }
      }
    });
  }

  isTrackingScript(src) {
    const gaScriptPatterns = [
      /google-analytics\.com/,
      /googletagmanager\.com/,
      /gtag\/js/,
      /gtm\.js/,
      /analytics\.js/,
      /ga\.js/,
      /facebook\.net/,
      /hotjar\.com/,
      /fullstory\.com/,
      /logrocket\.com/,
      /mouseflow\.com/,
      /smartlook\.com/,
      /tiktok\.com/
    ];
    
    return gaScriptPatterns.some(pattern => pattern.test(src));
  }

  extractTrackingDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/https?:\/\/([^\/]+)/);
      return match ? match[1] : this.domain;
    }
  }

  // OPTIMIZATION: Simplified observer setup
  setupOptimizedObservers() {
    // Mutation observer with throttling
    const throttledMutationHandler = throttle((mutations) => {
      this.handleMutations(mutations);
    }, 500);

    const observer = new MutationObserver(throttledMutationHandler);
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false, // Don't watch attributes for performance
      characterData: false // Don't watch text changes
    });
    
    // OPTIMIZATION: Simplified network monitoring
    this.setupLightweightNetworkMonitoring();
    
    // OPTIMIZATION: Simplified dataLayer monitoring
    this.setupLightweightDataLayerMonitoring();
  }

  handleMutations(mutations) {
    // OPTIMIZATION: Limit mutation processing
    const maxMutations = Math.min(mutations.length, 5);
    
    for (let i = 0; i < maxMutations; i++) {
      const mutation = mutations[i];
      
      // Only check added script elements
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
          this.checkNewScript(node);
        }
      });
    }
  }

  checkNewScript(script) {
    if (script.src && this.isTrackingScript(script.src)) {
      const trackingDomain = this.extractTrackingDomain(script.src);
      this.throttledReport('dynamic-script', `Dynamic script: ${script.src}`, trackingDomain);
    }
    
    // OPTIMIZATION: Limit inline script content scanning
    const content = script.textContent || script.innerHTML;
    if (content && content.length > 0 && content.length < 10000) { // Only scan small inline scripts
      this.scanScriptContent(content);
    }
  }

  // OPTIMIZATION: Lightweight network monitoring with throttling
  setupLightweightNetworkMonitoring() {
    const throttledRequestHandler = throttle((url) => {
      if (this.isTrackingRequest(url)) {
        const trackingDomain = this.extractTrackingDomain(url);
        this.throttledReport('network', `Network request: ${url}`, trackingDomain);
      }
    }, 2000);

    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      if (typeof url === 'string') {
        throttledRequestHandler(url);
      }
      return originalFetch.apply(this, args);
    };
    
    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string') {
        throttledRequestHandler(url);
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
  }

  // OPTIMIZATION: Lightweight dataLayer monitoring
  setupLightweightDataLayerMonitoring() {
    // Monitor dataLayer changes with throttling
    if (window.dataLayer) {
      const originalPush = window.dataLayer.push;
      const throttledDataLayerHandler = throttle((item) => {
        if (item && typeof item === 'object') {
          this.throttledReport('dataLayer-push', 'DataLayer push detected', this.domain);
        }
      }, 1000);

      window.dataLayer.push = (...args) => {
        args.forEach(throttledDataLayerHandler);
        return originalPush.apply(window.dataLayer, args);
      };
    }
  }

  isTrackingRequest(url) {
    const trackingPatterns = [
      /\/collect(\?|$)/,
      /\/g\/collect(\?|$)/,
      /\/mp\/collect(\?|$)/,
      /google-analytics\.com/,
      /googletagmanager\.com/,
      /facebook\.com\/tr/,
      /connect\.facebook\.net/,
      /hotjar\.com/,
      /fullstory\.com/,
      /analytics\.tiktok\.com/
    ];
    
    return trackingPatterns.some(pattern => pattern.test(url));
  }

  reportDetection(method, details, targetDomain = null) {
    const detectionKey = `${method}:${details}`;
    
    if (!this.detected.has(detectionKey)) {
      this.detected.add(detectionKey);
      
      // OPTIMIZATION: Limit detection cache size
      if (this.detected.size > 50) {
        // Clear oldest detections (simple approach)
        const keysToDelete = Array.from(this.detected).slice(0, 25);
        keysToDelete.forEach(key => this.detected.delete(key));
      }
      
      const domainToReport = targetDomain || this.domain;
      
      // Send to background script with error handling
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
          // Ignore errors if background script is not available
        });
      } catch (error) {
        // Ignore messaging errors
      }
      
      if (console && console.log) {
        console.log(`Nixxer detected tracking: ${method} - ${details} (domain: ${domainToReport})`);
      }
    }
  }
}

// OPTIMIZATION: Initialize only when appropriate
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NixxerContentDetector();
  });
} else {
  // OPTIMIZATION: Delay initialization to avoid blocking page load
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      new NixxerContentDetector();
    });
  } else {
    setTimeout(() => {
      new NixxerContentDetector();
    }, 500);
  }
}