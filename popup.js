// Enhanced Nixxer Popup Script with 1st/3rd Party Indicators

class NixxerPopup {
  constructor() {
    this.stats = null;
    this.init();
  }

  async init() {
    await this.loadStats();
    await this.loadVersion(); // Add this line
    this.setupEventListeners();
    this.updateUI();
  }

  async loadStats() {
    try {
      this.stats = await browser.runtime.sendMessage({ type: 'GET_STATS' });
    } catch (error) {
      console.error('Failed to load stats:', error);
      this.showError('Failed to load extension data');
    }
  }

  setupEventListeners() {
    // Toggle button
    document.getElementById('toggle-btn').addEventListener('click', () => {
      this.toggleExtension();
    });

    // Export button and menu
    const exportBtn = document.getElementById('export-btn');
    const exportMenu = document.getElementById('export-menu');
    
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('show');
    });

    // Close export menu when clicking outside
    document.addEventListener('click', () => {
      exportMenu.classList.remove('show');
    });

    // Export options
    document.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const format = e.target.dataset.format;
        this.exportBlocklist(format);
        exportMenu.classList.remove('show');
      });
    });

    // Options button
    document.getElementById('options-btn').addEventListener('click', () => {
      browser.runtime.openOptionsPage();
    });
  }

  updateUI() {
    if (!this.stats) {
      this.showError('No data available');
      return;
    }

    // Update status
    const statusEl = document.getElementById('status');
    if (this.stats.enabled) {
      statusEl.textContent = 'Active - Blocking GA tracking';
      statusEl.className = 'status enabled';
    } else {
      statusEl.textContent = 'Disabled - GA tracking allowed';
      statusEl.className = 'status disabled';
    }

    // Update toggle button
    const toggleBtn = document.getElementById('toggle-btn');
    if (this.stats.enabled) {
      toggleBtn.textContent = 'Disable';
      toggleBtn.className = 'btn btn-secondary';
    } else {
      toggleBtn.textContent = 'Enable';
      toggleBtn.className = 'btn btn-primary';
    }

    // Update statistics
    this.updateStats();

    // Update recent domains
    this.updateRecentDomains();
  }

  updateStats() {
    const statsEl = document.getElementById('stats');
    
    const statsHTML = `
      <div class="stat-item">
        <span class="stat-label">Blocked Today</span>
        <span class="stat-value">${this.stats.blockedToday.toLocaleString()}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Cookies Deleted</span>
        <span class="stat-value">${this.stats.cookiesDeleted.toLocaleString()}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Domains Detected</span>
        <span class="stat-value">${this.stats.totalDomains.toLocaleString()}</span>
      </div>
    `;
    
    statsEl.innerHTML = statsHTML;
  }

  updateRecentDomains() {
    const recentSection = document.getElementById('recent-section');
    const domainList = document.getElementById('domain-list');

    if (!this.stats.recentDomains || this.stats.recentDomains.length === 0) {
      recentSection.style.display = 'none';
      return;
    }

    recentSection.style.display = 'block';

    const domainsHTML = this.stats.recentDomains.map(domain => {
      const lastSeen = this.formatTime(domain.lastSeen);
      const types = domain.types ? domain.types.join(', ') : 'unknown';
      const trackingType = this.determineTrackingType(domain);
      
      return `
        <div class="domain-item">
          <div class="domain-header">
            <span class="domain-name" title="${domain.domain}">${domain.domain}</span>
            <span class="tracking-type ${trackingType.class}">${trackingType.label}</span>
          </div>
          <div class="domain-details">
            <div class="domain-info">
              <span>${domain.frequency}x</span>
              <span>${lastSeen}</span>
            </div>
            ${domain.hostDomain ? `<span class="domain-source">Found on: ${domain.hostDomain}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    domainList.innerHTML = domainsHTML || '<div class="no-data">No recent detections</div>';
  }

  determineTrackingType(domain) {
    const KNOWN_THIRD_PARTY = [
      'google-analytics.com',
      'googletagmanager.com',
      'stats.wp.com',
      'scorecardresearch.com',
      'quantserve.com',
      'doubleclick.net',
      'googlesyndication.com',
      'facebook.com',
      'connect.facebook.net',
      'analytics.twitter.com',
      'platform.twitter.com'
    ];

    const domainName = domain.domain.toLowerCase();
    
    // Check if it's a known third-party tracker
    const isKnownThirdParty = KNOWN_THIRD_PARTY.some(tracker => 
      domainName === tracker || domainName.endsWith('.' + tracker)
    );
    
    if (isKnownThirdParty) {
      return { class: 'third-party', label: '3rd Party' };
    }
    
    // Check if domain matches the host domain (indicating first-party)
    if (domain.hostDomain && domain.domain === domain.hostDomain) {
      return { class: 'first-party', label: '1st Party' };
    }
    
    // Check if domain is different from host domain
    if (domain.hostDomain && domain.domain !== domain.hostDomain) {
      return { class: 'third-party', label: '3rd Party' };
    }
    
    // Mixed or unknown case
    return { class: 'mixed', label: 'Mixed' };
  }

  async toggleExtension() {
    try {
      const result = await browser.runtime.sendMessage({ type: 'TOGGLE_ENABLED' });
      this.stats.enabled = result.enabled;
      this.updateUI();
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      this.showError('Failed to toggle extension');
    }
  }

  async exportBlocklist(format) {
    try {
      const exportBtn = document.getElementById('export-btn');
      exportBtn.textContent = 'Exporting...';
      exportBtn.disabled = true;

      const result = await browser.runtime.sendMessage({
        type: 'EXPORT_BLOCKLIST',
        format: format
      });

      if (result && result.content) {
        this.downloadFile(result.content, result.filename);
        this.showSuccess(`Exported ${format} blocklist`);
      } else {
        this.showError('Export failed - no data');
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Export failed');
    } finally {
      const exportBtn = document.getElementById('export-btn');
      exportBtn.textContent = 'Export';
      exportBtn.disabled = false;
    }
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  }

  showError(message) {
    const statsEl = document.getElementById('stats');
    statsEl.innerHTML = `<div class="error">${message}</div>`;
  }

  showSuccess(message) {
    // Create temporary success message
    const successEl = document.createElement('div');
    successEl.className = 'success';
    successEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #4ade80;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    successEl.textContent = message;
    
    document.body.appendChild(successEl);
    
    setTimeout(() => {
      if (successEl.parentNode) {
        successEl.parentNode.removeChild(successEl);
      }
    }, 3000);
  }

  async loadVersion() {
    try {
      const manifest = browser.runtime.getManifest();
      document.getElementById('version').textContent = `v${manifest.version}`;
    } catch (error) {
      console.error('Failed to load version:', error);
      document.getElementById('version').textContent = 'v?.?.?';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NixxerPopup();
});