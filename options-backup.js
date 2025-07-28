// Nixxer Options Script

class NixxerOptions {
  constructor() {
    this.settings = {
      detectionSensitivity: 'high',
      blockSelfHosted: true,
      debugLogging: false,
      maxHostsEntries: 500,
      autoExportThreshold: 450,
      autoCleanup: true,
      exportFormat: 'pihole'
    };
    
    this.domains = [];
    this.statistics = {};
    
    this.init();
  }

  async init() {
    await this.loadData();
    await this.loadVersion(); // Add this line
    this.setupEventListeners();
    this.updateUI();
  }

  async loadData() {
    try {
      const data = await browser.storage.local.get(['settings', 'detectedDomains', 'statistics']);
      
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
      }
      
      if (data.detectedDomains) {
        this.domains = Object.entries(data.detectedDomains).map(([domain, info]) => ({
          domain,
          ...info
        }));
      }
      
      if (data.statistics) {
        this.statistics = data.statistics;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showError('Failed to load settings');
    }
  }

  setupEventListeners() {
    // Range inputs
    this.setupRangeInput('max-hosts-entries', 'maxHostsEntries');
    this.setupRangeInput('auto-export-threshold', 'autoExportThreshold');
    
    // Radio buttons
    this.setupRadioGroup('sensitivity', 'detectionSensitivity');
    this.setupRadioGroup('export-format', 'exportFormat');
    
    // Checkboxes
    this.setupCheckbox('block-self-hosted', 'blockSelfHosted');
    this.setupCheckbox('debug-logging', 'debugLogging');
    this.setupCheckbox('auto-cleanup', 'autoCleanup');
    
    // Action buttons
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('export-data').addEventListener('click', () => {
      this.exportAllData();
    });
    
    document.getElementById('import-data').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
    });
    
    document.getElementById('clear-data').addEventListener('click', () => {
      this.clearAllData();
    });
  }

  setupRangeInput(inputId, settingKey) {
    const input = document.getElementById(inputId);
    const valueDisplay = document.getElementById(inputId.replace('-entries', '-value').replace('-threshold', '-value'));
    
    input.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.settings[settingKey] = value;
      valueDisplay.textContent = value;
      
      // Update auto-export threshold max based on max hosts entries
      if (settingKey === 'maxHostsEntries') {
        const thresholdInput = document.getElementById('auto-export-threshold');
        thresholdInput.max = value - 50;
        if (this.settings.autoExportThreshold >= value) {
          this.settings.autoExportThreshold = value - 50;
          thresholdInput.value = this.settings.autoExportThreshold;
          document.getElementById('auto-export-value').textContent = this.settings.autoExportThreshold;
        }
      }
    });
  }

  setupRadioGroup(groupName, settingKey) {
    const radios = document.querySelectorAll(`input[name="${groupName}"]`);
    
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.settings[settingKey] = e.target.value;
        }
      });
    });
  }

  setupCheckbox(inputId, settingKey) {
    const input = document.getElementById(inputId);
    
    input.addEventListener('change', (e) => {
      this.settings[settingKey] = e.target.checked;
    });
  }

  updateUI() {
    // Update range inputs
    document.getElementById('max-hosts-entries').value = this.settings.maxHostsEntries;
    document.getElementById('max-hosts-value').textContent = this.settings.maxHostsEntries;
        
    // Update the label text to reflect exportable domains only
    document.getElementById('hosts-entries').textContent = this.getExportableDomainsCount().toLocaleString();
    
    document.getElementById('auto-export-threshold').value = this.settings.autoExportThreshold;
    document.getElementById('auto-export-value').textContent = this.settings.autoExportThreshold;
    
    // Update radio buttons
    document.querySelector(`input[name="sensitivity"][value="${this.settings.detectionSensitivity}"]`).checked = true;
    document.querySelector(`input[name="export-format"][value="${this.settings.exportFormat}"]`).checked = true;
    
    // Update checkboxes
    document.getElementById('block-self-hosted').checked = this.settings.blockSelfHosted;
    document.getElementById('debug-logging').checked = this.settings.debugLogging;
    document.getElementById('auto-cleanup').checked = this.settings.autoCleanup;
    
    // Update statistics
    this.updateStatistics();
    
    // Update domains table
    this.updateDomainsTable();
  }

  updateStatistics() {
    document.getElementById('total-blocked').textContent = (this.statistics.blockedToday || 0).toLocaleString();
    document.getElementById('cookies-deleted').textContent = (this.statistics.cookiesDeleted || 0).toLocaleString();
    document.getElementById('domains-detected').textContent = this.domains.length.toLocaleString();
    document.getElementById('hosts-entries').textContent = this.getExportableDomainsCount().toLocaleString();
  }

  getExportableDomainsCount() {
    // Count only third-party tracking domains that would be exported
    const THIRD_PARTY_TRACKING_DOMAINS = [
      // Google Analytics/GTM
      'google-analytics.com',
      'googletagmanager.com',
      
      // Facebook/Meta
      'facebook.com',
      'connect.facebook.net',
      
      // Adobe
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
    
    return this.domains.filter(domain => {
      const domainName = domain.domain.toLowerCase();
      return THIRD_PARTY_TRACKING_DOMAINS.some(tracker => 
        domainName === tracker || domainName.endsWith('.' + tracker)
      );
    }).length;
  }

  updateDomainsTable() {
    const tableBody = document.getElementById('domains-table-body');
    
    if (this.domains.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #718096;">No domains detected yet</td></tr>';
      return;
    }
    
    // Sort domains by last seen (most recent first)
    const sortedDomains = [...this.domains].sort((a, b) => b.lastSeen - a.lastSeen);
    
    const rows = sortedDomains.slice(0, 50).map(domain => {
      const firstSeen = new Date(domain.firstSeen).toLocaleDateString();
      const lastSeen = new Date(domain.lastSeen).toLocaleDateString();
      const types = domain.gaTypes ? domain.gaTypes.join(', ') : 'unknown';
      
      return `
        <tr>
          <td title="${domain.domain}">${domain.domain}</td>
          <td>${firstSeen}</td>
          <td>${lastSeen}</td>
          <td>${domain.frequency || 1}</td>
          <td>${types}</td>
        </tr>
      `;
    }).join('');
    
    tableBody.innerHTML = rows;
    
    if (sortedDomains.length > 50) {
      tableBody.innerHTML += `
        <tr>
          <td colspan="5" style="text-align: center; color: #718096; font-style: italic;">
            Showing 50 of ${sortedDomains.length} detected domains
          </td>
        </tr>
      `;
    }
  }

  async saveSettings() {
    try {
      await browser.storage.local.set({ settings: this.settings });
      
      // Send updated settings to background script
      browser.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: this.settings
      });
      
      this.showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('Failed to save settings');
    }
  }

  exportAllData() {
    const exportData = {
      settings: this.settings,
      domains: this.domains,
      statistics: this.statistics,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nixxer-export-${Date.now()}.json`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    this.showSuccess('Data exported successfully');
  }

  async importData(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.settings || !Array.isArray(data.domains)) {
        throw new Error('Invalid data format');
      }
      
      // Confirm import
      if (!confirm('This will overwrite all current settings and data. Continue?')) {
        return;
      }
      
      // Update local data
      this.settings = { ...this.settings, ...data.settings };
      this.domains = data.domains || [];
      this.statistics = data.statistics || {};
      
      // Save to storage
      const storageData = {
        settings: this.settings,
        detectedDomains: {},
        statistics: this.statistics
      };
      
      // Convert domains array back to object format
      this.domains.forEach(domain => {
        storageData.detectedDomains[domain.domain] = {
          firstSeen: domain.firstSeen,
          lastSeen: domain.lastSeen,
          frequency: domain.frequency,
          gaTypes: domain.gaTypes,
          blocked: domain.blocked,
          details: domain.details
        };
      });
      
      await browser.storage.local.set(storageData);
      
      // Update UI
      this.updateUI();
      
      this.showSuccess('Data imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
      this.showError('Failed to import data: ' + error.message);
    }
  }

  async clearAllData() {
    if (!confirm('This will permanently delete all Nixxer data including detected domains, statistics, and settings. This cannot be undone. Continue?')) {
      return;
    }
    
    if (!confirm('Are you absolutely sure? This action cannot be reversed.')) {
      return;
    }
    
    try {
      await browser.storage.local.clear();
      
      // Reset local data
      this.settings = {
        detectionSensitivity: 'high',
        blockSelfHosted: true,
        debugLogging: false,
        maxHostsEntries: 500,
        autoExportThreshold: 450,
        autoCleanup: true,
        exportFormat: 'pihole'
      };
      this.domains = [];
      this.statistics = {};
      
      // Update UI
      this.updateUI();
      
      this.showSuccess('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showError('Failed to clear data');
    }
  }

  showSuccess(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.style.display = 'block';
    
    setTimeout(() => {
      successEl.style.display = 'none';
    }, 5000);
    
    // Hide error message if showing
    document.getElementById('error-message').style.display = 'none';
  }

  showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 8000);
    
    // Hide success message if showing
    document.getElementById('success-message').style.display = 'none';
  }

  async loadVersion() {
    try {
      const manifest = browser.runtime.getManifest();
      document.getElementById('version').textContent = `Version ${manifest.version}`;
    } catch (error) {
      console.error('Failed to load version:', error);
      document.getElementById('version').textContent = 'Version ?.?.?';
    }
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NixxerOptions();
});