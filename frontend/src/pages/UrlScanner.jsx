import React, { useState } from 'react';
import { Globe, Sparkles, AlertCircle, RefreshCw, Send, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { apiService } from '../services/api';
import { ScanResultCard } from '../components/ScanResultCard';

const URL_SAMPLES = [
  {
    name: 'Raw IP Host Phishing (High Risk)',
    url: 'http://192.168.1.50/account/login-verify.php'
  },
  {
    name: 'Userinfo "@" Spoofing Attack (High Risk)',
    url: 'http://myaccount.google.com@evil-credential-stealer.com/auth'
  },
  {
    name: 'Brand Mimicry & High-Risk TLD (High Risk)',
    url: 'http://paypal-verification-center.top/webscr?cmd=_login-run'
  },
  {
    name: 'Shortener Masking Destination (Medium Risk)',
    url: 'https://bit.ly/account-urgent-security-check'
  },
  {
    name: 'Deep Nested Subdomains (Medium Risk)',
    url: 'http://secure.login.banking.verify.attacker-portal.net/signin'
  },
  {
    name: 'Legitimate Web Target (Low Risk)',
    url: 'https://example.com'
  }
];

export const UrlScanner = ({ onScanComplete }) => {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!url.trim()) {
      setError('Please provide a URL to inspect.');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const data = await apiService.analyzeUrl(url.trim());
      setResult(data);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please check backend status.');
    } finally {
      setScanning(false);
    }
  };

  const loadSample = (sample) => {
    setUrl(sample.url);
    setError('');
    setResult(null);
  };

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" />
          URL Threat & Reputation Analyzer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Perform zero-contact static heuristic deconstruction on suspicious links to evaluate homographs, IP hosts, and deceptive structures.
        </p>
      </div>

      {/* Synthetic Demo Presets */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Hackathon Demo Presets (1-Click Safe Samples):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {URL_SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(sample)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleScan} className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Destination URL Target <span className="text-blue-400">*</span>
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="url-scan-input"
              type="text"
              placeholder="e.g. http://paypal-verification-center.top/login or https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400 transition font-mono"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Safe Analysis Guarantee: PhishGuard AI never navigates to, loads JavaScript, or fetches resources from the submitted URL.
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Clear URL
          </button>

          <button
            id="url-scan-btn"
            type="submit"
            disabled={scanning || !url.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-blue-950 flex items-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deconstructing URL Tokens...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Inspect URL</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-200 font-['Outfit']">
            Security Scan Results
          </h3>
          <ScanResultCard result={result} onScanAgain={handleReset} />
        </div>
      )}
    </div>
  );
};
