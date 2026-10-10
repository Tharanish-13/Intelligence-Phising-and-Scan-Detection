import React, { useState } from 'react';
import { Mail, Sparkles, AlertCircle, RefreshCw, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';
import { ScanResultCard } from '../components/ScanResultCard';

const EMAIL_SAMPLES = [
  {
    name: 'PayPal Phishing (High Risk)',
    subject: 'URGENT: Your PayPal Account Has Been Suspended',
    sender: 'security-alert@paypal-update-center.xyz',
    body: `Dear Valued Customer,

We have detected unauthorized activity on your account. For your protection, your access has been temporarily suspended.

Immediate action required within 24 hours. Failure to verify your identity will result in permanent account termination.

Please confirm your password, social security number, and billing card details immediately by visiting our secure portal:
http://paypal-verification-center.top/webscr?auth=urgent-verify

Sincerely,
PayPal Security Team`
  },
  {
    name: 'Netflix Credential Phish (High Risk)',
    subject: 'Action Required: Update payment details for Netflix',
    sender: 'billing@mail-update-service.tk',
    body: `Hi Customer,

We were unable to process your monthly subscription payment. Your membership is scheduled to expire in 12 hours.

To avoid service disruption, please verify your credit card details and account password at the following link:
http://netflix-billing-update.buzz/login

Thank you,
Netflix Support`
  },
  {
    name: 'Legitimate Team Meeting (Low Risk)',
    subject: 'Sprint Planning Meeting Tomorrow at 10 AM',
    sender: 'sarah.miller@cyberguard-security.com',
    body: `Hi Team,

Please review the attached project board before tomorrow's 10 AM sprint planning meeting.

Let me know if anyone has conflicts or agenda items they would like to add.

Best regards,
Sarah Miller
Engineering Lead`
  }
];

export const EmailScanner = ({ onScanComplete }) => {
  const [subject, setSubject] = useState('');
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!body.trim()) {
      setError('Please provide email body content to analyze.');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const data = await apiService.analyzeEmail({
        subject,
        sender,
        body,
      });
      setResult(data);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please verify backend is running.');
    } finally {
      setScanning(false);
    }
  };

  const loadSample = (sample) => {
    setSubject(sample.subject);
    setSender(sample.sender);
    setBody(sample.body);
    setError('');
    setResult(null);
  };

  const handleReset = () => {
    setSubject('');
    setSender('');
    setBody('');
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Mail className="w-6 h-6 text-cyan-400" />
          Email Phishing Analyzer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Inspect email headers, psychological urgency coercion, credential harvesting, and spoofed senders.
        </p>
      </div>

      {/* Synthetic Demo Presets */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hackathon Demo Presets (1-Click Safe Samples):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EMAIL_SAMPLES.map((sample, idx) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Subject Line
            </label>
            <input
              id="email-subject-input"
              type="text"
              placeholder="e.g. URGENT: Your Account Has Been Locked"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sender Email Address (Optional)
            </label>
            <input
              id="email-sender-input"
              type="email"
              placeholder="e.g. security@paypal-verify.xyz"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Email Body Content <span className="text-cyan-400">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {body.length} characters
            </span>
          </div>
          <textarea
            id="email-body-input"
            rows={7}
            placeholder="Paste raw email text content or suspected phishing message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition font-sans"
          />
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
            Clear Fields
          </button>

          <button
            id="email-scan-btn"
            type="submit"
            disabled={scanning || !body.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Heuristic Engine...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze Email</span>
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
