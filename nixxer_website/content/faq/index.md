+++
date = '2025-07-07T23:14:23-05:00'
draft = false
title = 'Frequently Asked Questions'
layout = 'top-level'
toc = true
+++

## General Usage

**Q: What exactly does Nixxer block?**

**A:** Nixxer blocks tracking from major platforms including Google Analytics, Facebook/Meta Pixel, Adobe Analytics, session recording tools (Hotjar, FullStory), TikTok analytics, and zombie cookies. It intelligently distinguishes between third-party tracking domains (which are blocked at the network level) and self-hosted analytics (blocked only in the browser to prevent website breakage).

**Q: Why do I see different colored labels (red, yellow, purple) in the popup?**

**A:** These indicate tracker types:

- **🔴 Red (3rd Party)**: External tracking domains like google-analytics.com that are added to exportable blocklists
- **🟡 Yellow (1st Party)**: Self-hosted tracking on the same domain, blocked at browser level only
- **🟣 Purple (Mixed)**: Multiple detection methods or unclear classification

**Q: Will Nixxer break websites I visit?**

**A:** No, Nixxer is designed to prevent website breakage. It only adds third-party tracking domains to network blocklists, never legitimate website domains. Self-hosted analytics are blocked at the browser level without affecting website functionality.

## Installation & Setup

**Q: How do I install Nixxer permanently?**

**A:** Currently, Nixxer must be loaded as a temporary extension through `about:debugging` in Firefox. For permanent installation, it would need to be signed by Mozilla or you'd need Firefox Developer Edition. The extension files must be saved locally and loaded manually.

**Q: Can I use Nixxer with other privacy extensions?**

**A:** Yes, Nixxer is designed to work alongside other privacy tools. However, you may see overlapping functionality with other tracker blockers. Consider adjusting sensitivity settings if you experience conflicts.

## Detection & Blocking

**Q: Why another privacy plugin?**

**A:** Think of Nixxer as a "tracking specialist" - current ad blockers and blocklists handle general privacy protection. Nixxer focuses specifically on sophisticated tracking techniques like zombie cookies, canvas fingerprinting, and analytics platforms that adapt to avoid traditional blocklists. The combination enables both broad protection and deep tracking detection that other tools often miss.

**Q: What's the difference between "Browser-only" and "Network-level" blocking?**

**A:**

- **Browser-only**: Blocks tracking scripts and cookies only within Firefox, doesn't affect other devices/browsers
- **Network-level**: Blocks tracking domains at your router/DNS level, protecting all devices on your network

**Q: Why doesn't Nixxer block some trackers I know are present?**

**A:** Check these factors:

- Detection sensitivity setting (try "High" for maximum protection)
- Whether the tracker is self-hosted (shown as yellow "1st Party" in popup)
- If it's a new/unknown tracker not yet in Nixxer's patterns
- Enable debug logging to see detailed detection attempts

**Q: What are "zombie cookies" and how does Nixxer stop them?**

**A:** Zombie cookies are tracking mechanisms that recreate themselves even after deletion, using LocalStorage, IndexedDB, canvas fingerprinting, or other browser features. Nixxer actively monitors and prevents these persistence techniques.

## Export & Network Blocking

**Q: What's the safest way to use exported blocklists?**

**A:** Nixxer only exports third-party tracking domains, never website domains. This means exported lists won't break websites when used in Pi-hole, NextDNS, or similar network blockers. Start with the default settings and monitor for any issues.

**Q: Which export format should I choose?**

**A:**

- **Pi-hole**: Most popular home network blocker
- **NextDNS**: Cloud-based DNS filtering service
- **Hosts file**: Manual system-level blocking
- **AdGuard Home**: Self-hosted alternative to Pi-hole

**Q: How often should I export new blocklists?**

**A:** Export when the extension suggests it (near the 950-domain threshold) or weekly/monthly depending on your browsing habits. More browsing = more tracker discovery = more frequent exports needed.

**Q: Can I import blocklists from other sources into Nixxer?**

**A:** No, Nixxer only imports its own backup files and doesn't accept external blocklists. However, this is by design - Nixxer isn't meant to replace your existing blocking tools, but to make them more effective at stopping tracking. You can use your existing blocklists in Pi-hole, NextDNS, or AdGuard Home alongside Nixxer's exported domains as an additional list.

## Settings & Configuration

**Q: What detection sensitivity should I use?**

**A:**

- **Low**: Conservative, fewer false positives, may miss some trackers
- **Medium**: Balanced approach, recommended for most users
- **High**: Maximum protection, may have occasional false positives

**Q: Should I enable "Block self-hosted Google Analytics"?**

**A:** Yes, if you want complete protection. This detects analytics hosted on the same domain as the website. Disable only if you experience website functionality issues.

**Q: What happens when I reach the maximum stored domains limit?**

**A:** Nixxer will automatically suggest exporting your blocklist. If auto-cleanup is enabled, it removes the oldest entries. You can adjust the limit (100-5000 domains) in settings.

## Troubleshooting

**Q: The extension shows "Loading..." but never loads data**

**A:** Try these steps:

1. Refresh the page and reopen the popup
2. Check Firefox's extension debugging console for errors
3. Reload the extension in `about:debugging`
4. Ensure all extension files are properly saved and named

**Q: I'm seeing very high blocking numbers - is this normal?**

**A:** Modern websites often load dozens of tracking requests. Seeing hundreds or thousands of blocked requests daily is normal for active browsing. Check the "Recent Detections" to see what's being blocked.

**Q: Can I whitelist specific websites or trackers?**

**A:** Currently, Nixxer doesn't have a whitelist feature. You can disable the extension temporarily or adjust detection sensitivity. Consider using your network blocker's whitelist for specific domains if needed.

**Q: The extension is using a lot of memory - how can I reduce it?**

**A:**

1. Reduce maximum stored domains in settings
2. Enable automatic cleanup
3. Clear old data in the options page
4. Export and clear statistics regularly

## Data & Privacy

**Q: What data does Nixxer collect about me?**

**A:** Nixxer only stores locally:

- Detected tracking domains
- Detection timestamps and frequency
- Your configuration settings
- Blocking statistics

No data is sent to external servers - everything stays on your device.

**Q: How do I backup my Nixxer data?**

**A:** Use the "Export Backup" button in the options page to download a JSON file containing all your settings, detected domains, and statistics. You can restore this later with "Import Backup."

**Q: Can I transfer my Nixxer data to another computer?**

**A:** Yes, export your data as a backup file on the old computer, then import it on the new installation.

## Advanced Usage

**Q: How can I verify that network-level blocking is working?**

**A:**

1. Export and install a blocklist in your network blocker
2. Visit tracking-heavy websites
3. Check your network blocker's logs for blocked requests
4. Use online privacy testing tools to verify reduced tracking

**Q: Can I modify the exported blocklists before using them?**

**A:** Yes, exported files are plain text. You can edit them to add/remove domains, but be careful not to block legitimate services.

**Q: Is there an API or way to automate Nixxer exports?**

**A:** Currently, no. Exports must be done manually through the extension interface. This is by design to give users control over their data.

## Performance & Compatibility

**Q: Does Nixxer slow down web browsing?**

**A:** Nixxer is optimized for performance with minimal impact. The average processing time per request is typically under 3ms. Some users may notice slightly faster page loads due to blocked tracking requests.

**Q: Will Nixxer work with private browsing/incognito mode?**

**A:** Yes, but Firefox extensions need to be explicitly enabled for private browsing. Check your extension settings in `about:addons`.

**Q: Can I use Nixxer on mobile Firefox?**

**A:** Desktop extensions generally don't work on mobile Firefox. You'd need to use the exported blocklists with a mobile DNS blocker like Blokada or AdGuard.

## Getting Help

**Q: Where can I report bugs or request features?**

**A:** We welcome bug reports and feature requests! Please visit our GitHub repository at https://github.com/lenwood/nixxer/issues to:
- **Report bugs**: Include your browser version, extension version, and steps to reproduce the issue
- **Request features**: Describe your use case and how the feature would improve your tracking protection
- **Ask questions**: Get help from our community of privacy-focused users

When reporting issues, enabling debug logging in Nixxer's options page can provide valuable diagnostic information to help us resolve problems quickly.

**Q: The extension stopped working after a Firefox update**

**A:** Reload the extension in `about:debugging`. Firefox updates sometimes require extensions to be reloaded, especially temporary ones.

**Q: Can I contribute to Nixxer development?**

**A:** Absolutely! Nixxer thrives on community contributions and we'd love your help. Visit https://github.com/lenwood/nixxer to get started with:

- **Testing**: Help us identify new trackers and verify blocking effectiveness across different websites
- **Documentation**: Improve our guides, create tutorials, or translate content for international users  
- **Code**: Add support for new tracking platforms, enhance detection methods, or improve performance
- **Translation**: Make Nixxer accessible to non-English speaking privacy advocates worldwide

Whether you're a developer, privacy enthusiast, or documentation writer, there's a way for you to help make the web more private for everyone. Check our README.md for detailed contribution guidelines and current project needs.
