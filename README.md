# Nixxer - Comprehensive Web Tracking Blocker

A powerful Firefox browser extension that detects and blocks web tracking across all major platforms, with intelligent network-level blocklist management and advanced anti-persistence protection.

## Features

### 🛡️ Multi-Platform Tracking Detection
- **Google Analytics & Google Tag Manager** - All versions and implementations
- **Facebook/Meta Tracking** - Pixel tracking, conversion API, social plugins
- **Adobe Analytics** - Omniture, AppMeasurement, Adobe Experience Cloud
- **Session Recording** - Hotjar, FullStory, LogRocket, Mouseflow, SmartLook
- **TikTok Analytics** - Pixel tracking and business API endpoints
- **Advanced Persistence Protection** - Zombie cookies, canvas fingerprinting, storage abuse

### 🎯 Intelligent Detection Methods
- **Real-time request blocking** of tracking endpoints
- **Cookie pattern matching** for all major tracking platforms
- **JavaScript function detection** (`gtag()`, `fbq()`, `s.t()`, `hj()`, etc.)
- **Network request monitoring** for tracking collection endpoints
- **Self-hosted tracking detection** - blocks analytics even when hosted on same domain
- **Zombie cookie prevention** - LocalStorage, IndexedDB, and canvas fingerprinting protection

### 📊 Smart Domain Management
- **Selective network blocking** - only third-party tracking domains added to blocklists
- **Browser-level blocking** for self-hosted analytics to preserve website functionality  
- **LRU eviction** when approaching entry limits (default: 1,000 entries)
- **Domain frequency tracking** with timestamps and source attribution
- **Automatic cleanup** of old entries (30-day retention)

### 📤 Export & Migration Tools
- **Pi-hole compatible** blocklist format
- **NextDNS** JSON format support
- **Hosts file** format for manual installation
- **AdGuard Home** filter format
- **One-click export** functionality
- **Automatic export suggestions** when limits are reached

**Safe Export Policy:** Exported blocklists contain only third-party tracking domains (like `google-analytics.com`, `facebook.com/tr`) detected during browsing. Self-hosted analytics are blocked at the browser level and don't appear in exports, ensuring legitimate website domains are never accidentally blocked at the network level.

### 📈 Detailed Analytics & Monitoring
- Real-time blocking statistics across all tracker types
- Cookie deletion counts and frequency analysis
- Recent activity monitoring with tracker type identification
- Domain classification (3rd-party vs 1st-party vs mixed)
- Comprehensive detection method tracking

## Installation

### Manual Installation (Developer Mode)

1. **Download the extension files**
   - Save all the provided files in a folder called `Nixxer`
   - Ensure the following structure:
   ```
   Nixxer/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── popup.html
   ├── popup.js
   ├── options.html
   ├── options.js
   └── icons/
       ├── icon-16.png
       ├── icon-32.png
       ├── icon-48.png
       ├── icon-128.png
       └── icon-256.png
   ```

2. **Load in Firefox**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from your Nixxer folder

### Permanent Installation
If the extension is signed by Mozilla users will have the option for installing directly via Mozilla Add-Ons.

## Usage

### Basic Operation

1. **Enable/Disable**: Click the Nixxer icon in your toolbar
2. **View Statistics**: See real-time blocking stats across all tracker types in the popup
3. **Recent Activity**: Monitor recently detected domains with tracker type indicators
4. **Export Blocklists**: Use the Export button for network-level blocking

### Tracker Type Indicators

The popup shows detected trackers with color-coded labels:
- **🔴 3rd Party**: External tracking domains (exported to blocklists)
- **🟡 1st Party**: Self-hosted tracking (browser-only blocking)
- **🟣 Mixed**: Multiple detection methods or unclear classification

### Settings Configuration

Access settings by clicking "Options" in the popup or right-clicking the extension icon.

#### Detection Settings
- **Sensitivity**: Adjust detection aggressiveness
  - **Low**: Conservative detection, fewer false positives
  - **Medium**: Balanced approach (recommended)
  - **High**: Aggressive detection, maximum protection
- **Self-hosted blocking**: Enable detection of same-domain analytics
- **Debug logging**: Enable detailed console logging for troubleshooting

#### Network Blocklist Management
- **Maximum stored domains**: Set limit for tracked domains (100-5000)
- **Auto-export threshold**: When to suggest network-level migration
- **Automatic cleanup**: Remove old entries when limit reached

#### Export Preferences
- **Default format**: Choose Pi-hole, NextDNS, hosts file, or AdGuard format
- **One-click export**: Download blocklists instantly

## Supported Tracking Platforms

### Google Ecosystem
- **Google Analytics** (Universal Analytics, GA4)
- **Google Tag Manager** (GTM containers, custom implementations)
- **Google Ads** (conversion tracking, remarketing)
- **DoubleClick** (ad serving, attribution)

### Social Media Tracking
- **Facebook/Meta** (Pixel, Conversions API, social plugins)
- **Twitter/X** (analytics, conversion tracking)
- **TikTok** (Pixel, business analytics)

### Enterprise Analytics
- **Adobe Analytics** (Omniture, AppMeasurement, Experience Cloud)
- **Quantcast** (audience measurement)
- **ComScore** (web analytics)

### User Experience Tracking
- **Hotjar** (heatmaps, session recordings, surveys)
- **FullStory** (session replay, user analytics)
- **LogRocket** (session replay, performance monitoring)
- **Mouseflow** (session replay, heatmaps)
- **SmartLook** (session recordings, event tracking)

### Zombie Cookie Protection
- **LocalStorage abuse** (backup tracking IDs)
- **IndexedDB tracking** (persistent storage abuse)
- **Canvas fingerprinting** (browser uniqueness detection)
- **ETag abuse** (HTTP cache-based tracking)
- **Service Worker persistence** (background tracking)

## Export Formats

### Pi-hole Format
```
# Nixxer Generated Blocklist
# Generated: 2025-07-05T12:00:00.000Z
# Total domains: 247
# Trackers: Google Analytics, Facebook, Adobe, Hotjar, TikTok

google-analytics.com
googletagmanager.com
connect.facebook.net
2o7.net
hotjar.com
analytics.tiktok.com
```

### NextDNS Format
```json
{
  "name": "Nixxer Comprehensive Blocklist",
  "description": "Multi-platform tracking protection",
  "domains": [
    "google-analytics.com",
    "connect.facebook.net",
    "2o7.net",
    "hotjar.com"
  ],
  "metadata": {
    "trackerTypes": ["analytics", "social", "session-recording"],
    "detectionMethods": ["request", "cookie", "javascript"]
  }
}
```

### Hosts File Format
```
# Nixxer Generated Hosts File
# Generated: 2025-07-05T12:00:00.000Z
# Total domains: 247
# Multi-platform tracking protection

0.0.0.0 google-analytics.com
0.0.0.0 connect.facebook.net
0.0.0.0 2o7.net
0.0.0.0 hotjar.com
```

### AdGuard Home Format
```
! Title: Nixxer Anti-Tracking Rules
! Generated: 2025-07-05T12:00:00.000Z
! Total domains: 247

||google-analytics.com^
||connect.facebook.net^
||2o7.net^
||hotjar.com^
```

## Network-Level Blocking Setup

### Pi-hole Setup
1. Export blocklist in Pi-hole format
2. Upload to your Pi-hole admin interface:
   - Go to Group Management → Adlists
   - Add the exported file URL or paste content
   - Update gravity: `pihole -g`

### NextDNS Setup
1. Export in NextDNS format
2. Log into NextDNS dashboard
3. Go to Denylist → Import
4. Upload the JSON file

### AdGuard Home Setup
1. Export in AdGuard format
2. Access AdGuard Home admin panel
3. Go to Filters → DNS blocklists
4. Add custom list and paste content

### Manual Hosts File
1. Export in hosts format
2. Append content to your system hosts file:
   - **Windows**: `C:\Windows\System32\drivers\etc\hosts`
   - **macOS/Linux**: `/etc/hosts`
3. Flush DNS cache and restart browser

## Technical Details

### Detection Architecture

#### Multi-Layer Detection
- **Network Layer**: Request URL pattern matching
- **Cookie Layer**: Name and value pattern analysis  
- **JavaScript Layer**: Function call and object detection
- **Storage Layer**: LocalStorage, IndexedDB, and cache monitoring
- **Canvas Layer**: Fingerprinting attempt detection

#### Tracker Classification
```javascript
// Example: Facebook tracking detection
const FACEBOOK_PATTERNS = {
  cookies: [/^_fbc$/, /^_fbp$/, /^fr$/],
  requests: [/facebook\.com\/tr/, /connect\.facebook\.net/],
  scripts: [/fbq\s*\(/, /_fbq\.push/]
};
```

#### Smart Blocking Logic
- **Third-party domains**: Added to network blocklists for router/DNS blocking
- **Self-hosted analytics**: Blocked at browser level only
- **Zombie cookies**: Immediate cleanup with source tracking
- **Canvas fingerprinting**: Method interception and spoofing

### Performance Optimization

- **Efficient regex patterns** optimized for speed
- **Request deduplication** to avoid redundant analysis
- **Batched storage operations** for minimal I/O overhead
- **Memory management** with LRU cache and automatic cleanup
- **Background processing** for non-blocking operation

### Privacy & Security

- **Local-only storage** - no external data transmission
- **Selective data collection** - only tracking domains and detection methods
- **User-controlled exports** - manual data sharing only
- **Transparent operation** - open source detection methods
- **No legitimate domain blocking** - smart classification prevents website breakage

## Troubleshooting

### Common Issues

**Extension not blocking trackers**
- Check if extension is enabled (green status in popup)
- Verify detection sensitivity in settings (try "High")
- Enable debug logging to see detection attempts in console
- Check if trackers are self-hosted (blocked at browser level, not exported)

**Website functionality broken**
- This should rarely occur with v1.1+ due to improved domain classification
- Extension distinguishes between tracking domains and website content
- If issues persist, try lowering detection sensitivity
- Report specific problematic domains for pattern refinement

**High memory usage**
- Reduce maximum stored domains in settings
- Enable automatic cleanup
- Clear old data in options page
- Check for zombie cookie accumulation

**False positive detections**
- Lower detection sensitivity to "Medium" or "Low"
- Disable self-hosted detection if not needed
- Review detected domains list for legitimate services
- Report false positives for pattern improvement

### Debug Information

Enable debug logging in settings to see detailed information:
- Detection attempts with tracker type classification
- Blocked requests with reasoning
- Domain classification decisions (3rd-party vs self-hosted)
- Zombie cookie prevention actions
- Performance metrics and timing

### Advanced Troubleshooting

**Testing tracker blocking:**
1. Visit websites known to use tracking (news sites, e-commerce)
2. Check popup for recent detections
3. Enable debug logging and monitor browser console
4. Verify blocklist exports contain expected domains

**Validating network-level blocking:**
1. Export blocklist to your network blocker
2. Test with online tracker detection tools
3. Use browser developer tools to verify blocked requests
4. Check for tracking cookie absence

## Development

### File Structure
- `manifest.json` - Extension metadata and permissions
- `background.js` - Core detection and blocking logic with multi-tracker support
- `content.js` - Page-level scanning and zombie cookie protection
- `popup.html/js` - Extension interface with tracker type indicators
- `options.html/js` - Comprehensive settings management

### Contributing
1. Follow Firefox extension best practices
2. Include comprehensive error handling for all tracker types
3. Maintain backward compatibility with existing exports
4. Add tests for new detection patterns
5. Update documentation for new tracker support
6. Consider performance impact of new detection methods

### Adding New Trackers
To add support for a new tracking platform:

1. **Define patterns** in `background.js`:
```javascript
const NEW_TRACKER_COOKIE_PATTERNS = [/^_newtracker$/];
const NEW_TRACKER_REQUEST_PATTERNS = [/newtracker\.com/];
```

2. **Update detection methods**:
```javascript
// Add to isTrackingCookie() and isTrackingRequest()
const isNewTrackerName = NEW_TRACKER_COOKIE_PATTERNS.some(pattern => pattern.test(name));
```

3. **Add to third-party domains list** in `determineBlockingTarget()`

4. **Update content script** with JavaScript detection patterns

5. **Test thoroughly** with websites using the new tracker

## License

This extension is provided as-is for educational and privacy protection purposes. Use responsibly and in accordance with website terms of service and applicable privacy laws.

## Changelog

### Version 1.2.0 - Multi-Platform Tracking Protection
- **🆕 Facebook/Meta tracking detection** - Pixel, Conversions API, social plugins
- **🆕 Adobe Analytics support** - Omniture, AppMeasurement, Experience Cloud
- **🆕 Session recording protection** - Hotjar, FullStory, LogRocket, Mouseflow, SmartLook
- **🆕 TikTok tracking detection** - Pixel and business analytics
- **🆕 Zombie cookie protection** - LocalStorage, IndexedDB, canvas fingerprinting
- **🆕 Enhanced export formats** - AdGuard Home support added
- **🆕 Tracker type classification** - 3rd-party vs 1st-party indicators
- **🆕 Advanced persistence protection** - Multiple anti-tracking techniques
- **⚡ Performance improvements** - Optimized pattern matching and memory usage
- **📊 Enhanced statistics** - Multi-tracker analytics and detailed reporting

### Version 1.1.3
- **Fixed domain detection** - prevents legitimate websites from being blocked
- **Smart blocking logic** - distinguishes third-party vs self-hosted analytics
- **Improved accuracy** - only tracking domains added to network blocklists
- **Enhanced content script** - better detection of tracking vs content domains

### Version 1.0.0
- Initial release with Google Analytics and GTM focus
- Basic hosts file management
- Multi-format export support
- Comprehensive settings interface
- Real-time statistics tracking

---

**Nixxer** - Comprehensive web tracking protection for the privacy-conscious user.