import axios from 'axios';

const API_BASE = 'https://intelligence-phising-and-scan-detection.onrender.com' || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Storage key for scan history
const STORAGE_KEY = 'phishguard_scan_history_v1';

export const apiService = {
  // Health check
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (err) {
      console.warn('Health check failed:', err.message);
      return { status: 'offline', version: '1.0.0', reputation_configured: false };
    }
  },

  // Analyze URL
  async analyzeUrl(url) {
    const response = await apiClient.post('/analyze/url', { url });
    apiService.saveScanToHistory(response.data);
    return response.data;
  },

  // Analyze Email
  async analyzeEmail({ subject, sender, body }) {
    const response = await apiClient.post('/analyze/email', {
      subject: subject || '',
      sender: sender ? sender.trim() : null,
      body,
    });
    apiService.saveScanToHistory(response.data);
    return response.data;
  },

  // Analyze SMS
  async analyzeSms({ message }) {
    const response = await apiClient.post('/analyze/sms', { message });
    apiService.saveScanToHistory(response.data);
    return response.data;
  },

  // Analyze QR Code
  async analyzeQr(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/analyze/qr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    apiService.saveScanToHistory(response.data);
    return response.data;
  },

  // LocalStorage Scan History Helpers
  getScanHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed reading scan history from localStorage:', e);
      return [];
    }
  },

  saveScanToHistory(scan) {
    try {
      const history = apiService.getScanHistory();
      // Prepend newest scan, cap at 50 records
      const updated = [scan, ...history.filter(s => s.id !== scan.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed writing scan to localStorage:', e);
    }
  },

  clearScanHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed clearing history:', e);
    }
  },

  getStats() {
    const history = apiService.getScanHistory();
    const total = history.length;
    let high = 0;
    let medium = 0;
    let low = 0;

    history.forEach(scan => {
      if (scan.severity === 'High') high++;
      else if (scan.severity === 'Medium') medium++;
      else low++;
    });

    return { total, high, medium, low, history };
  }
};
