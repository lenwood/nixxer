// Nixxer Background Script - Final Optimized Version

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
    patternCache.set(patternString, new RegExp(patternString));
  }
  return patternCache.get(patternString);
}

// Detection patterns - EXPANDED & OPTIMIZED
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

// OPTIMIZATION: Hierarchical domain matching for performance
const KNOWN_TRACKING_DOMAINS = new Set([
  // Google Analytics/GTM
  'google-analytics.com',
  'googletagmanager.com',
  'www.google-analytics.com',
  'www.googletagmanager.com',
  
  // Facebook/Meta
  'facebook.com',
  'connect.facebook.net',
  'www.facebook.com',
  
  // Adobe Analytics
  '2o7.net',
  'omtrdc.net',
  'demdex.net',
  'everesttech.net',
  
  // Session Recording
  'hotjar.com',
  'fullstory.com',
  'logrocket.com',
  'mouseflow.com',
  'smartlook.com',
  
  // TikTok
  'analytics.tiktok.com',
  'business-api.tiktok.com',
  
  // Other major trackers
  'stats.wp.com',
  'scorecardresearch.com',
  'quantserve.com',
  'doubleclick.net',
  'googlesyndication.com',
  'analytics.twitter.com',
  'platform.twitter.com'
]);

// OPTIMIZATION: Fast lookup for common tracking domain suffixes
const TRACKING_DOMAIN_SUFFIXES = new Set([
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'hotjar.com',
  'fullstory.com',
  'doubleclick.net'
]);

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
    
    // OPTIMIZATION: Performance monitoring
    this.performanceStats = {
      requestsProcessed: 0,
      requestsBlocked: 0,
      avgProcessingTime: 0
    };
    
    // OPTIMIZATION: Batch storage operations
    this.pendingSave = false;
    this.debouncedSave = debounce(this.saveData.bind(this), 3000);
    
    // OPTIMIZATION: Request deduplication cache
    this.recentRequests = new Map();
    this.cleanupRecentRequests = debounce(() => {
      const cutoff = Date.now() - 5000; // 5 seconds
      for (const [url, timestamp] of this.recentRequests.entries()) {
        if (timestamp < cutoff) {
          this.recentRequests.delete(url);
        }
      }
    }, 10000);
    
    this.init();
  }

  async init() {
    try {
      await this.loadStoredData();
      this.setupRequestBlocking();
      this.setupCookieMonitoring();
      this.setupMessageHandling();
      this.scheduleCleanup();
      
      // OPTIMIZATION: Performance monitoring
      this.schedulePerformanceReporting();
      
      if (this.settings.debugLogging) {
        console.log('Nixxer initialized successfully with advanced optimizations');
      }
    } catch (error) {
      console.error('Nixxer initialization failed:', error);
    }
  }

  async loadStoredData() {
    try {
      const data = await browser.storage.local.get(['detectedDomains', 'settings', 'statistics']);
      
      if (data.detectedDomains) {
        this.detectedDomains = new Map(Object.entries(data.detectedDomains));
      }
      
      if (data.settings) {
        this.settings = Object.assign(this.settings, data.settings);
      }
      
      if (data.statistics) {
        this.blockedToday = data.statistics.blockedToday || 0;
        this.cookiesDeleted = data.statistics.cookiesDeleted || 0;
        
        const lastUpdated = data.statistics.lastUpdated || Date.now();
        const daysDiff = Math.floor((Date.now() - lastUpdated) / (24 * 60 * 60 * 1000));
        if (daysDiff >= 1) {
          this.blockedToday = 0;
        }
      }
    } catch (error) {
      console.error('Failed to load stored data:', error);
    }
  }

  // OPTIMIZATION: Batched save with debouncing
  async saveData() {
    if (this.pendingSave) return;
    
    try {
      this.pendingSave = true;
      await browser.storage.local.set({
        detectedDomains: Object.fromEntries(this.detectedDomains),
        settings: this.settings,
        statistics: {
          blockedToday: this.blockedToday,
          cookiesDeleted: this.cookiesDeleted,
          lastUpdated: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      this.pendingSave = false;
    }
  }

  // OPTIMIZATION: Enhanced domain pre-filtering with caching
  isKnownTrackingDomain(hostname) {
    // Fast exact match
    if (KNOWN_TRACKING_DOMAINS.has(hostname)) {
      return true;
    }
    
    // Fast suffix check for common patterns
    for (const suffix of TRACKING_DOMAIN_SUFFIXES) {
      if (hostname.endsWith(suffix)) {
        return true;
      }
    }
    
    // Fallback: full domain check
    for (const domain of KNOWN_TRACKING_DOMAINS) {
      if (hostname.endsWith('.' + domain)) {
        return true;
      }
    }
    
    return false;
  }

  setupRequestBlocking() {
    browser.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (!this.isEnabled) return {};
        
        // OPTIMIZATION: Request deduplication
        const now = Date.now();
        if (this.recentRequests.has(details.url)) {
          const lastSeen = this.recentRequests.get(details.url);
          if (now - lastSeen < 1000) { // Skip if seen within 1 second
            return {};
          }
        }
        this.recentRequests.set(details.url, now);
        this.cleanupRecentRequests();
        
        // OPTIMIZATION: Performance timing
        const startTime = performance.now();
        
        try {
          const url = new URL(details.url);
          const hostname = url.hostname;
          
          // OPTIMIZATION: Fast path check first
          if (!this.isKnownTrackingDomain(hostname) && !this.isTrackingRequest(details.url)) {
            this.updatePerformanceStats(startTime, false);
            return {};
          }
          
          const blockingInfo = this.determineBlockingTarget(hostname, 'request', details.url);
          
          if (blockingInfo.shouldBlock) {
            this.handleTrackerDetection(hostname, 'request', details.url);
            this.blockedToday++;
            
            if (this.settings.debugLogging) {
              console.log('Blocked tracking request:', details.url);
            }
            
            this.updatePerformanceStats(startTime, true);
            return { cancel: true };
          }
          
          this.updatePerformanceStats(startTime, false);
        } catch (error) {
          if (this.settings.debugLogging) {
            console.error('Error in request blocking:', error);
          }
          this.updatePerformanceStats(startTime, false);
        }
        
        return {};
      },
      { urls: ['<all_urls>'] },
      ['blocking']
    );
  }

  // OPTIMIZATION: Performance monitoring
  updatePerformanceStats(startTime, blocked) {
    const processingTime = performance.now() - startTime;
    this.performanceStats.requestsProcessed++;
    if (blocked) {
      this.performanceStats.requestsBlocked++;
    }
    
    // Running average
    this.performanceStats.avgProcessingTime = 
      (this.performanceStats.avgProcessingTime * (this.performanceStats.requestsProcessed - 1) + processingTime) / 
      this.performanceStats.requestsProcessed;
  }

  schedulePerformanceReporting() {
    setInterval(() => {
      if (this.settings.debugLogging && this.performanceStats.requestsProcessed > 0) {
        console.log('Nixxer Performance Stats:', {
          requestsProcessed: this.performanceStats.requestsProcessed,
          requestsBlocked: this.performanceStats.requestsBlocked,
          blockingRate: (this.performanceStats.requestsBlocked / this.performanceStats.requestsProcessed * 100).toFixed(2) + '%',
          avgProcessingTime: this.performanceStats.avgProcessingTime.toFixed(3) + 'ms'
        });
      }
    }, 60000); // Report every minute
  }

  setupCookieMonitoring() {
    browser.cookies.onChanged.addListener((changeInfo) => {
      if (!this.isEnabled || changeInfo.removed) return;
      
      try {
        const cookie = changeInfo.cookie;
        if (this.isTrackingCookie(cookie.name, cookie.value)) {
          this.handleTrackerDetection(cookie.domain, 'cookie', cookie.name);
          this.deleteCookie(cookie);
        }
      } catch (error) {
        console.error('Error in cookie monitoring:', error);
      }
    });
    
    // OPTIMIZATION: Reduced cleanup frequency
    setInterval(() => this.cleanupCookies(), 30000);
  }

  setupMessageHandling() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        switch (message.type) {
          case 'GA_DETECTED':
            this.handleTrackerDetection(message.domain, message.method, message.details);
            break;
          
          case 'GET_STATS':
            const stats = this.getStats();
            // OPTIMIZATION: Include performance stats
            stats.performance = this.performanceStats;
            sendResponse(stats);
            break;
          
          case 'TOGGLE_ENABLED':
            this.isEnabled = !this.isEnabled;
            sendResponse({ enabled: this.isEnabled });
            break;
          
          case 'EXPORT_BLOCKLIST':
            this.exportBlocklist(message.format).then(sendResponse);
            return true;
          
          case 'GET_DETECTED_DOMAINS':
            sendResponse(Array.from(this.detectedDomains.entries()));
            break;
          
          case 'SETTINGS_UPDATED':
            this.settings = Object.assign(this.settings, message.settings);
            this.debouncedSave(); // Use debounced save
            break;
          
          case 'CLEAR_STATS':
            this.blockedToday = 0;
            this.cookiesDeleted = 0;
            // OPTIMIZATION: Reset performance stats too
            this.performanceStats = {
              requestsProcessed: 0,
              requestsBlocked: 0,
              avgProcessingTime: 0
            };
            this.debouncedSave(); // Use debounced save
            sendResponse({ success: true });
            break;

          case 'ZOMBIE_COOKIE_DETECTED':
            this.handleZombieCookieDetection(message.domain, message.method, message.details);
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      }
    });
  }

  // EXPANDED: Now checks all tracker types
  isTrackingRequest(url) {
    return GA_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
           FACEBOOK_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
           ADOBE_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
           SESSION_RECORDING_REQUEST_PATTERNS.some(pattern => pattern.test(url)) ||
           TIKTOK_REQUEST_PATTERNS.some(pattern => pattern.test(url));
  }

  // EXPANDED: Now checks all tracker types
  isTrackingCookie(name, value) {
    const isGAName = GA_COOKIE_PATTERNS.some(pattern => pattern.test(name));
    const isGTMName = GTM_COOKIE_PATTERNS.some(pattern => pattern.test(name));
    const isFacebookName = FACEBOOK_COOKIE_PATTERNS.some(pattern => pattern.test(name));
    const isAdobeName = ADOBE_COOKIE_PATTERNS.some(pattern => pattern.test(name));
    const isSessionRecordingName = SESSION_RECORDING_COOKIE_PATTERNS.some(pattern => pattern.test(name));
    const isTikTokName = TIKTOK_COOKIE_PATTERNS.some(pattern => pattern.test(name));
    
    if (isGAName || isGTMName || isFacebookName || isAdobeName || isSessionRecordingName || isTikTokName) {
      if (value && GA_VALUE_PATTERNS.some(pattern => pattern.test(value))) {
        return true;
      }
      return true;
    }
    
    return false;
  }

  async handleTrackerDetection(domain, method, details) {
    try {
      const now = Date.now();
      const blockingInfo = this.determineBlockingTarget(domain, method, details);
      
      if (!blockingInfo.shouldBlock) {
        if (this.settings.debugLogging) {
          console.log('Tracker detected on', domain, 'but no blocking action needed');
        }
        return;
      }
      
      if (blockingInfo.addToBlocklist) {
        const domainKey = blockingInfo.targetDomain.startsWith('.') ? 
          blockingInfo.targetDomain.slice(1) : blockingInfo.targetDomain;
        
        this.updateDetectedDomain(domainKey, method, details, domain, now);
        
        if (this.settings.debugLogging) {
          console.log('Added tracking domain to blocklist:', domainKey);
        }
      }
      
      if (this.detectedDomains.size >= this.settings.autoExportThreshold) {
        this.manageBlocklist();
      }
      
      // OPTIMIZATION: Use debounced save instead of immediate save
      this.debouncedSave();
    } catch (error) {
      console.error('Error handling tracker detection:', error);
    }
  }

  async handleZombieCookieDetection(domain, method, details) {
    try {
      if (this.settings.debugLogging) {
        console.log('Zombie cookie detected on', domain, ':', method, '-', details);
      }
      
      const now = Date.now();
      const zombieKey = domain + '_zombie';
      
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
      
      // OPTIMIZATION: Use debounced save
      this.debouncedSave();
    } catch (error) {
      console.error('Error handling zombie cookie detection:', error);
    }
  }

  updateDetectedDomain(domainKey, method, details, hostDomain, timestamp) {
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
      
      // OPTIMIZATION: Limit details array growth
      if (existing.details.length < 5) {
        existing.details.push(details);
      }
    }
  }

  // EXPANDED: Updated with all tracker types
  determineBlockingTarget(domain, method, details) {
    const THIRD_PARTY_TRACKING_DOMAINS = [
      // Google Analytics/GTM
      'google-analytics.com',
      'googletagmanager.com',
      'www.google-analytics.com',
      'www.googletagmanager.com',
      
      // Facebook/Meta
      'facebook.com',
      'connect.facebook.net',
      'www.facebook.com',
      
      // Adobe Analytics
      '2o7.net',
      'omtrdc.net',
      'demdex.net',
      'everesttech.net',
      
      // Session Recording
      'hotjar.com',
      'fullstory.com',
      'logrocket.com',
      'mouseflow.com',
      'smartlook.com',
      
      // TikTok
      'analytics.tiktok.com',
      'business-api.tiktok.com',
      
      // Other trackers
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
        console.warn('Failed to parse URL from request details:', details);
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
  }

  isSelfHostedGA(details, method) {
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
  }

  async deleteCookie(cookie) {
    try {
      await browser.cookies.remove({
        url: 'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain + cookie.path,
        name: cookie.name
      });
      this.cookiesDeleted++;
      
      if (this.settings.debugLogging) {
        console.log('Deleted tracking cookie:', cookie.name, 'from', cookie.domain);
      }
    } catch (error) {
      console.error('Failed to delete cookie:', error);
    }
  }

  async cleanupCookies() {
    if (!this.isEnabled) return;
    
    try {
      const allCookies = await browser.cookies.getAll({});
      
      for (const cookie of allCookies) {
        if (this.isTrackingCookie(cookie.name, cookie.value)) {
          await this.deleteCookie(cookie);
        }
      }
    } catch (error) {
      console.error('Cookie cleanup failed:', error);
    }
  }

  async manageBlocklist() {
    if (!this.settings.autoCleanup) return;
    
    const entries = Array.from(this.detectedDomains.entries());
    
    if (entries.length > this.settings.maxHostsEntries) {
      entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen);
      
      const toRemove = entries.slice(0, entries.length - this.settings.maxHostsEntries);
      toRemove.forEach(([domain]) => {
        this.detectedDomains.delete(domain);
      });
      
      if (this.settings.debugLogging) {
        console.log('Removed', toRemove.length, 'old entries from blocklist');
      }
    }
    
    this.suggestExport();
  }

  suggestExport() {
    browser.runtime.sendMessage({
      type: 'EXPORT_SUGGESTED',
      domainCount: this.detectedDomains.size,
      threshold: this.settings.autoExportThreshold
    }).catch(() => {
      // Ignore errors if popup/options not open
    });
  }

  getStats() {
    const recentDomains = Array.from(this.detectedDomains.entries())
      .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
      .slice(0, 10);
    
    return {
      enabled: this.isEnabled,
      blockedToday: this.blockedToday,
      cookiesDeleted: this.cookiesDeleted,
      totalDomains: this.detectedDomains.size,
      settings: this.settings,
      recentDomains: recentDomains.map(([domain, data]) => ({
        domain,
        lastSeen: data.lastSeen,
        frequency: data.frequency,
        types: data.gaTypes,
        hostDomain: data.hostDomain
      }))
    };
  }

  async exportBlocklist(format) {
    try {
      const domains = Array.from(this.detectedDomains.keys()).sort();
      const timestamp = new Date().toISOString();
      
      switch (format) {
        case 'pihole':
          return {
            content: '# Nixxer Generated Blocklist (Optimized)\n# Generated: ' + timestamp + '\n# Total domains: ' + domains.length + '\n# Multi-platform tracking protection\n# Extension performance: ' + this.performanceStats.avgProcessingTime.toFixed(2) + 'ms avg\n\n' + domains.join('\n'),
            filename: 'nixxer-blocklist-' + Date.now() + '.txt'
          };
        
        case 'nextdns':
          return {
            content: JSON.stringify({
              name: 'Nixxer Multi-Platform Blocklist (Optimized)',
              description: 'Auto-generated comprehensive tracking protection - ' + timestamp,
              version: '1.2.0',
              domains: domains,
              metadata: {
                totalDomains: domains.length,
                generatedAt: timestamp,
                trackerTypes: ['Google Analytics', 'Facebook', 'Adobe', 'Session Recording', 'TikTok'],
                performance: {
                  avgProcessingTime: this.performanceStats.avgProcessingTime.toFixed(3) + 'ms',
                  requestsProcessed: this.performanceStats.requestsProcessed,
                  blockingRate: (this.performanceStats.requestsBlocked / Math.max(this.performanceStats.requestsProcessed, 1) * 100).toFixed(2) + '%'
                }
              }
            }, null, 2),
            filename: 'nixxer-blocklist-' + Date.now() + '.json'
          };
        
        case 'hosts':
          const hostsEntries = domains.map(domain => '0.0.0.0 ' + domain).join('\n');
          return {
            content: '# Nixxer Generated Hosts File (Optimized)\n# Generated: ' + timestamp + '\n# Total domains: ' + domains.length + '\n# Multi-platform tracking protection\n# Extension performance: ' + this.performanceStats.avgProcessingTime.toFixed(2) + 'ms avg\n\n' + hostsEntries,
            filename: 'nixxer-hosts-' + Date.now() + '.txt'
          };
        
        case 'adguard':
          const adguardRules = domains.map(domain => '||' + domain + '^').join('\n');
          return {
            content: '! Title: Nixxer Multi-Platform Tracking Rules (Optimized)\n! Generated: ' + timestamp + '\n! Total domains: ' + domains.length + '\n! Extension version: 1.2.0\n! Performance: ' + this.performanceStats.avgProcessingTime.toFixed(2) + 'ms avg\n\n' + adguardRules,
            filename: 'nixxer-adguard-' + Date.now() + '.txt'
          };
        
        default:
          throw new Error('Unsupported export format: ' + format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  scheduleCleanup() {
    setInterval(() => {
      this.performScheduledCleanup();
    }, 24 * 60 * 60 * 1000);
    
    this.performScheduledCleanup();
  }

  async performScheduledCleanup() {
    try {
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let removedCount = 0;
      
      for (const [domain, data] of this.detectedDomains.entries()) {
        if (data.lastSeen < cutoff) {
          this.detectedDomains.delete(domain);
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        this.debouncedSave(); // Use debounced save for cleanup
        if (this.settings.debugLogging) {
          console.log('Scheduled cleanup removed', removedCount, 'old domains');
        }
      }
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  }
}

// Initialize Nixxer
const nixxer = new NixxerCore();