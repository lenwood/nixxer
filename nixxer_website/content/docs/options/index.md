+++
date = '2025-08-12T19:37:30-05:00'
draft = false
weight = 20
title = 'Options'
description = 'The Nixxer Options page is your control center for configuring tracking detection, managing blocked domains, and integrating with network-level blockers like Pi-hole and NextDNS. This comprehensive interface gives you granular control over how Nixxer protects your privacy while browsing.'
+++

The Nixxer Options page is your control center for configuring tracking detection, managing blocked domains, and integrating with network-level blockers like Pi-hole and NextDNS. This comprehensive interface gives you granular control over how Nixxer protects your privacy while browsing.

**Access the Options page by:**
- Right-clicking the Nixxer extension icon → "Options"
- Going to `about:addons` → Nixxer → "Preferences"
- Using the gear icon in the Nixxer popup

---

## Interface Overview

The Options page is organized into logical sections, each focusing on specific aspects of Nixxer's functionality:

### Header Section
- **Extension icon and title** with current version number
- **Real-time status** indicator showing if Nixxer is active
- **Success/error message area** for configuration feedback

### Main Configuration Sections
1. **Detection Settings** - How Nixxer identifies trackers
2. **Network Blocklist Management** - Storage and export controls
3. **Export Settings** - Output format preferences
4. **Statistics** - Real-time performance metrics
5. **Detected Domains** - Comprehensive tracker inventory
6. **Data Management** - Backup, restore, and reset options

---

## Detection Settings

Configure how aggressively Nixxer detects and blocks tracking attempts.

### Detection Sensitivity

**Purpose:** Controls how many tracking patterns Nixxer looks for and how strict the matching criteria are.

- **Low Sensitivity**
 - Conservative detection focusing on obvious trackers
 - Minimal false positives
 - Best for: Users who want basic protection without any risk of website breakage

- **Medium Sensitivity** 
 - Balanced approach detecting most common trackers
 - Occasional false positives possible
 - Best for: Most users seeking good protection with minimal issues

- **High Sensitivity** (Recommended)
 - Aggressive detection catching advanced tracking techniques
 - Higher chance of false positives
 - Best for: Privacy-focused users wanting maximum protection

**Recommendation:** Start with High sensitivity. If you experience website functionality issues, step down to Medium.

### Block Self-Hosted Google Analytics

**Purpose:** Determines whether Nixxer blocks Google Analytics when it's hosted on the same domain as the website you're visiting.

**When Enabled:**
- Blocks analytics even when hosted at `yoursite.com/analytics.js`
- Provides maximum privacy protection
- May occasionally break website functionality that depends on analytics

**When Disabled:**
- Only blocks third-party analytics domains (like `google-analytics.com`)
- Safer for website compatibility
- Still provides substantial privacy protection

**Important:** Self-hosted analytics are **never** included in network blocklist exports, preventing website breakage when using Pi-hole or NextDNS.

### Enable Debug Logging

**Purpose:** Outputs detailed information about Nixxer's detection process to the browser console.

**When to Enable:**
- Troubleshooting detection issues
- Reporting bugs to developers
- Understanding why specific trackers were or weren't detected
- Contributing to Nixxer development

**Performance Impact:** Minimal - only affects console output, not actual blocking performance.

**Accessing Debug Logs:**
1. Enable this setting
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for "Nixxer" prefixed messages

---

## Network Blocklist Management

Control how many tracking domains Nixxer stores and when to export them to network-level blockers.

### Maximum Stored Domains

**Purpose:** Limits how many tracking domains Nixxer keeps in local storage.

**Range:** 100 - 5,000 domains
**Default:** 500 domains
**Recommended:** 500-1,000 for most users

**Why Limits Matter:**
- **Storage efficiency:** Prevents unlimited memory usage
- **Performance:** Faster lookup and processing
- **Export quality:** Focuses on most relevant trackers

**Automatic Cleanup:** When the limit is reached, Nixxer removes the oldest detected domains using an LRU (Least Recently Used) algorithm.

### Auto-Export Threshold

**Purpose:** Suggests creating blocklist exports when approaching your storage limit.

**Range:** 50 domains below maximum up to 50 less than maximum
**Example:** If maximum is 500, threshold can be 50-450

**How It Works:**
- Nixxer monitors detected domain count
- When threshold is reached, suggests exporting data
- Helps maintain optimal storage usage
- Ensures you don't lose valuable tracking domain data

### Automatic Cleanup

**Purpose:** Automatically removes old domain entries when storage limit is reached.

**When Enabled:**
- Seamless operation without manual intervention
- Oldest domains automatically removed
- Most active trackers retained

**When Disabled:**
- Manual management required when limit reached
- More control over which domains to keep
- Risk of hitting storage limits

**Recommendation:** Keep enabled unless you need manual control over domain retention.

## Export Settings

Configure default format for creating network-level blocklists from detected tracking domains.

### Export Formats

Nixxer supports four major network blocking platforms:

#### Pi-hole Format


## Statistics Dashboard

Real-time metrics showing Nixxer's effectiveness and activity.

#### Metrics Explained

**Total Blocked**

- **Count:** Total tracking requests blocked across all websites
- **Timeframe:** Since extension installation or last data reset
- **Includes:** All blocked tracker requests, not unique domains

**Cookies Deleted**

- **Count:** Tracking cookies and zombie cookies removed
- **Includes:** Third-party tracking cookies, persistent identifier cookies
- **Importance:** Shows protection against cookie-based tracking

**Domains Detected**

- **Count:** Unique tracking domains discovered
- **Includes:** Both third-party and self-hosted tracking domains
- **Growth:** Increases as you visit different websites

**Exportable Domains**

- **Count:** Third-party tracking domains available for network export
- **Subset:** Only domains safe for network-level blocking
- **Export Ready:** These domains can be safely imported into Pi-hole/NextDNS

**Understanding the Numbers**

- **High Domain Detection (500+):** Indicates extensive browsing across many sites with tracking
- **Low Exportable Ratio:** Suggests many sites use self-hosted analytics
- **High Blocking Count:** Shows active protection across your browsing sessions

**Detected Domains Table**

Comprehensive view of all tracking domains Nixxer has discovered during your browsing.
Table Columns

**Data Management**

**Table Columns**

- **Domain:** Full domain name of detected tracker. Click to see full domain if truncated. Hover for complete domain tooltip.
- **First Seen:** Date when domain was first detected.
- **Last Seen:** Most recent detection date.
- **Frequency:** Number of times this domain was detected. Higher numbers indicate more prevalent trackers. Helps prioritize blocking efforts.
- **Types:** Classification of tracking methods detected. Multiple types possible per domain.

**Table Features**

- **Sorted by recency:** Most recently seen domains appear first.
- **Limited display:** Shows 50 most recent domains for performance.
- **Full data available:** Complete list included in exports.
- **Real-time updates:** Refreshes as new trackers are detected.

###### Data Management

Tools for backing up, restoring, and managing your Nixxer configuration and detected domains.

**Save Settings**

Immediately saves all current configuration changes to browser storage. Use after changing any detection or export settings, before exporting data or clearing storage or when troubleshooting configuration issues.

What's Saved:

- Detection sensitivity level
- All checkbox preferences
- Storage limits and thresholds
- Export format preference

**Export Backup**

Creates a complete backup file containing all Nixxer data.

Backup Contents:

- All configuration settings
- Complete detected domains list
- Usage statistics and metrics
- Export metadata and timestamps
- Critical error logs (for troubleshooting)

File Format: JSON file named nixxer-export-[timestamp].json

**Import Backup**

Restores Nixxer data from a previously exported backup file.

Import Process:

1. Click "Import Backup" to open file picker
2. Select a .json backup file created by Nixxer
3. Confirm overwrite of current data
4. Wait for import completion and success message

Safety Features:

- Data validation: Ensures backup file integrity before import
- Confirmation prompts: Prevents accidental data loss
- Error handling: Graceful failure with detailed error messages
- Rollback protection: Current data validation before overwrite

What's Restored:

- All settings and preferences
- Complete detected domains database
- Historical statistics (when available)
- Previous export configurations

**Clear All Data**

Permanently removes all Nixxer data and resets to factory defaults.

***DANGER:*** This action cannot be undone and permanently deletes:

- All detected tracking domains
- Usage statistics and history
- Custom configuration settings
- Export preferences and data

Safety Measures:

- Double confirmation: Two separate confirmation dialogs
- Clear warnings: Explicit statements about data loss
- Export suggestion: Recommendation to backup before clearing




Advanced Configuration Tips
Optimal Settings for Different Use Cases
Maximum Privacy Configuration

Detection Sensitivity: High
Block Self-Hosted: Enabled
Maximum Domains: 1,000+
Auto-Export Threshold: 80% of maximum
Export Format: Based on your network blocker

Compatibility-Focused Configuration

Detection Sensitivity: Medium
Block Self-Hosted: Disabled
Maximum Domains: 500
Auto-Export Threshold: 90% of maximum
Debug Logging: Enabled (for troubleshooting)

Network Administrator Configuration

Detection Sensitivity: High
Maximum Domains: 2,000+
Auto-Export Threshold: 70% of maximum
Automatic Cleanup: Enabled
Regular exports: Weekly/monthly to update network blockers

Performance Optimization
For Slower Devices

Lower maximum domain limits (300-500)
Disable debug logging
Use Medium sensitivity
Enable automatic cleanup

For Privacy Enthusiasts

Maximum domain limits (1,000+)
High sensitivity detection
Enable all blocking options
Regular backup exports

Troubleshooting Configuration Issues
Website Functionality Problems

Temporarily disable "Block Self-Hosted"
Reduce detection sensitivity to Medium
Check debug logs for specific blocking events
Report false positives to developers

Poor Detection Performance

Increase detection sensitivity to High
Enable debug logging to verify detection
Check if domains are being detected but not blocked
Verify extension permissions are granted

Storage or Performance Issues

Reduce maximum domain limits
Enable automatic cleanup
Export and clear old data regularly
Check browser storage quotas


Error Handling & Recovery
The Nixxer Options page includes comprehensive error handling to ensure reliable operation even when problems occur.
Automatic Error Recovery

Retry mechanisms: Failed operations automatically retry with exponential backoff
Timeout protection: Prevents hanging operations from freezing the interface
Graceful degradation: Options page remains functional even if some features fail
Error logging: Detailed error information for troubleshooting

Common Error Scenarios
"Failed to Initialize Options Page"
Cause: Extension permissions or storage access issues
Solution:

Reload the options page
Check extension permissions in browser settings
Try disabling/re-enabling the extension
Clear browser cache and storage

"Settings Save Failed"
Cause: Browser storage quota exceeded or permissions issue
Solution:

Try saving again (automatic retry)
Reduce maximum domain storage limit
Clear old data to free storage space
Check browser storage settings

"Import Data Failed"
Cause: Corrupted backup file or invalid format
Solution:

Verify backup file is valid JSON
Try importing a different backup file
Check file wasn't corrupted during transfer
Create new backup from working installation

Emergency Recovery Mode
If the Options page fails to load completely, Nixxer provides an emergency interface with:

Basic error information display
Options to reload or reset extension data
Links to support resources
Manual storage clearing functionality


Integration with Network Blockers
Pi-hole Integration Workflow

Configure Nixxer with desired detection settings
Browse normally for several days to build domain list
Export data using Pi-hole format when threshold reached
Import to Pi-hole via admin interface or command line
Update regularly as new trackers are detected

NextDNS Integration Process

Set export format to NextDNS in Options
Build domain database through normal browsing
Export JSON file when ready to update blocklist
Import to NextDNS via dashboard or API
Monitor effectiveness and update as needed

AdGuard Home Setup

Configure AdGuard format in export settings
Generate blocklist from detected domains
Add custom filter in AdGuard Home
Set update schedule for regular domain list refresh
Monitor blocking and adjust sensitivity as needed


Privacy and Security Notes
Data Storage and Privacy

Local storage only: All data stored locally in browser, never transmitted
No external connections: Nixxer never communicates with external servers
User-controlled exports: You decide when and what to share
Transparent operation: All detection methods are documented and open

Security Considerations

Minimal permissions: Nixxer requests only necessary browser permissions
Safe operation: Robust error handling prevents crashes or data corruption
Isolated execution: Extension runs in sandboxed environment
Open source: All code available for security review

Data Retention

User-controlled: You set storage limits and retention policies
Automatic cleanup: Old data removed when limits reached
Export backups: Complete data portability at any time
Clear deletion: Data removal is permanent and thorough


Support and Troubleshooting
Getting Help

Debug logging: Enable for detailed troubleshooting information
Error messages: Pay attention to specific error details in the interface
Browser console: Check for additional error information (F12 → Console)
Backup data: Export current configuration before making major changes

Reporting Issues
When reporting problems, include:

Browser version and operating system
Nixxer version (shown in Options page header)
Specific error messages or unexpected behavior
Debug logs if available
Steps to reproduce the issue

Best Practices

Regular backups: Export data periodically to prevent loss
Gradual configuration: Start with default settings and adjust slowly
Monitor statistics: Use metrics to verify Nixxer is working effectively
Update network blockers: Refresh Pi-hole/NextDNS lists regularly with new detections