+++
date = '2025-07-07T23:04:29-05:00'
draft = false
weight = 35
title = 'Troubleshooting'
description = "If you're having trouble with the plugin begin here."
+++

### Common Issues

#### Extension Not Blocking Trackers

**Symptoms**: Statistics show 0 blocked requests

**Solutions**:

1. Check extension is enabled (green status in popup)
2. Increase detection sensitivity to "High"
3. Enable debug logging and check console
4. Verify you're visiting sites with tracking
5. Clear browser cache and restart

**Debug Steps**:

```javascript
// In browser console
console.log('Nixxer enabled:', await browser.runtime.sendMessage({type: 'GET_STATS'}));
```

#### Website Functionality Broken

**Symptoms**: Forms don't submit, analytics dashboards broken

**Solutions**:

1. Lower detection sensitivity to "Medium" or "Low"
2. Disable self-hosted tracking detection
3. Check if site domain is in detected list incorrectly
4. Temporarily disable extension for testing

**Note**: v1.2+ should rarely break websites due to improved domain classification.

#### High Memory Usage

**Symptoms**: Browser slowdown, extension errors

**Solutions**:

1. Reduce max stored domains in settings
2. Enable automatic cleanup
3. Clear extension data in options
4. Check for zombie cookie accumulation

**Memory Management**:

```javascript
// Check storage usage
browser.storage.local.getBytesInUse().then(bytes => 
  console.log('Storage usage:', bytes, 'bytes')
);
```

#### Export Files Empty

**Symptoms**: Generated blocklists contain no domains

**Causes**:

- No third-party trackers detected yet
- All detections are self-hosted (browser-only blocking)
- Storage corruption

**Solutions**:

1. Visit more websites with tracking
2. Check detected domains list in options
3. Verify export format compatibility
4. Re-scan with higher sensitivity

#### Performance Issues

**Symptoms**: Slow page loading, high CPU usage

**Solutions**:

1. Lower detection sensitivity
2. Disable debug logging
3. Reduce max stored domains
4. Clear old detection data

**Performance Monitoring**:

```javascript
// View performance stats (debug mode)
browser.runtime.sendMessage({type: 'GET_STATS'}).then(stats => 
  console.log('Performance:', stats.performance)
);
```

### Error Recovery

#### Storage Corruption

```javascript
// Emergency reset
browser.storage.local.clear().then(() => {
  console.log('Extension data cleared');
  location.reload();
});
```

#### API Failures

- Extension includes automatic retry logic
- Exponential backoff for transient failures
- Graceful degradation when APIs unavailable
- User notification for persistent failures

#### Critical Errors

Critical errors are logged and can be viewed:

1. Open options page
2. Check browser console for detailed logs
3. Export settings before reset if needed
4. Use "Clear All Data" as last resort

### Browser Compatibility

#### Firefox Requirements

- Firefox 88+ (Manifest V2)
- WebRequest API permissions
- Storage API access
- Cookies API permissions

#### Known Limitations

- Chrome/Edge not supported (different manifest version)
- Some private browsing restrictions
- Corporate firewall interference
- Ad-blocker conflicts possible
