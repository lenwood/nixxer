+++
date = '2025-07-07T22:55:11-05:00'
draft = false
weight = 15
title = 'User Guide'
description = 'Learn how to operate the Nixxer Firefox extension. This page covers the popup interface, detection types, blocking modes, export formats for Pi-hole/NextDNS/AdGuard, advanced settings, and network-level integration steps.'
+++

### Getting Started

#### 1. Initial Setup

- Extension auto-starts upon installation
- Default settings provide balanced protection
- No configuration required for basic use

#### 2. Using the Popup Interface

- **Status Indicator**: Shows if extension is active
- **Statistics**: Real-time blocking counters
- **Recent Detections**: Last 10 detected tracking domains
- **Export Button**: Generate network blocklists
- **Options Button**: Access advanced settings

#### 3. Understanding Detection Types

- **🔴 3rd Party**: External tracking domains (safe to block at network level)
- **🟡 1st Party**: Self-hosted analytics (blocked in browser only)
- **🟣 Mixed**: Multiple detection methods or unclear classification

### Core Features

#### Blocking Modes

1. **Browser-Level**: Blocks requests and deletes cookies in Firefox only
2. **Network-Level**: Generate blocklists for router/DNS-level blocking

#### Export Formats

- **Pi-hole**: Plain text domain list
- **NextDNS**: JSON format with metadata
- **Hosts File**: Standard hosts file format
- **AdGuard Home**: Filter rule format

#### Statistics Tracking

- Requests blocked today
- Tracking cookies deleted
- Unique domains detected
- Performance metrics

### Advanced Usage

#### Settings Configuration

Access via popup → Options or right-click extension icon

**Detection Settings**

- **Sensitivity**: Low/Medium/High detection aggressiveness
- **Self-hosted blocking**: Detect same-domain analytics
- **Debug logging**: Enable detailed console output

**Blocklist Management**

- **Max domains**: Storage limit (100-5000)
- **Auto-export threshold**: When to suggest network migration
- **Auto-cleanup**: Remove old entries automatically

#### Network-Level Setup

**Pi-hole Integration**

1. Export blocklist in Pi-hole format
2. Upload to Pi-hole admin interface
3. Add to Group Management → Adlists
4. Update gravity: `pihole -g`

**NextDNS Integration**

1. Export in NextDNS JSON format
2. Login to NextDNS dashboard
3. Go to Denylist → Import
4. Upload the JSON file

**AdGuard Home Integration**

1. Export in AdGuard format
2. Access AdGuard Home admin panel
3. Go to Filters → DNS blocklists
4. Add custom list with exported content
