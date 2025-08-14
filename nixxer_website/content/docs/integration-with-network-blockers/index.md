+++
date = '2025-08-12T22:05:30-05:00'
draft = false
weight = 25
title = 'Integration with Network Blockers'
description = 'Nixxer is designed to work in tandem with a network blocker. This page covers how these complementary tools work together to protect you from being tracked. It also shows how to export blocklists to simplify the process.'
+++

Using Nixxer in tandem with a network blocker ensures that common analytics packages are blocked regardless of where they are hosted or how they're masked. And Nixxer makes it easy to work with common tools.

Exported blocklists contain only third-party tracking domains (like google-analytics.com, facebook.com/tr) detected during browsing. Self-hosted analytics are blocked at the browser level and don't appear in exports, ensuring legitimate website domains are never accidentally blocked at the network level.

**Network Blocker Workflow**

1. Configure Nixxer with desired detection settings.
2. Browse normally for several days to build domain list.
3. Export data using Pi-hole format when threshold reached.
4. Import to your network blocker of choice.
5. Update regularly as new trackers are detected.

##### Network Blocker Setup Instructions

**Pi-hole Setup**

1. Export blocklist in Pi-hole format.
2. Upload to your Pi-hole admin interface:
   - Go to Group Management → Adlists
   - Add the exported file URL or paste content
   - Update gravity: pihole -g

**NextDNS Setup**

1. Export in NextDNS format.
2. Log into NextDNS dashboard.
3. Go to Denylist → Import.
4. Upload the JSON file

**AdGuard Home Setup**

1. Export in AdGuard format.
2. Access AdGuard Home admin panel.
3. Go to Filters → DNS blocklists.
4. Add custom list and paste content

**Manual Hosts File**

1. Export in hosts format.
2. Append content to your system hosts file:
   - Windows: C:\Windows\System32\drivers\etc\hosts
   - macOS/Linux: /etc/hosts
3. Flush DNS cache and restart browser
