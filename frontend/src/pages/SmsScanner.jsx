import React, { useState } from 'react';
import { MessageSquare, Sparkles, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { apiService } from '../services/api';
import { ScanResultCard } from '../components/ScanResultCard';

const SMS_SAMPLES = [
  {
    name: 'USPS Delivery Fee Scam (High Risk)',
    message: 'USPS: Your package cannot be delivered due to incomplete street address. Please pay $1.99 redelivery fee at http://usps-redelivery-portal.top to avoid return to sender.'
  },
  {
    name: 'Chase Bank 2FA Fraud Alert (High Risk)',
    message: 'Chase Alert: Unusual debit charge of $742.50 detected on your account. Reply with your 6-digit OTP passcode or visit http://chase-secure-verify.xyz/auth immediately to block this transaction.'
  },
  {
    name: 'Lottery Prize Windfall (High Risk)',
    message: 'CONGRATULATIONS! Your mobile number was selected as a lucky winner of $250,000 cash in our annual sweepstakes. Click http://cash-prize-claim.tk/win to register your bank account details.'
  },
  {
    name: 'IRS Tax Refund Scam (High Risk)',
    message: 'IRS Notification: An outstanding federal tax refund of $1,420.50 is waiting for your confirmation. Claim your payout now: http://irs-gov-refund.top/tax-claim'
  },
  {
    name: 'Legitimate Appointment SMS (Low Risk)',
    message: 'Your dental cleaning appointment with Dr. Evans is confirmed for Thursday, Oct 15 at 2:30 PM. Reply YES to confirm or call 555-0199 to reschedule.'
  }
];

export const SmsScanner = ({ onScanComplete }) => {
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!message.trim()) {
      setError('Please provide SMS text message content to analyze.');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const data = await apiService.analyzeSms({ message });
      setResult(data);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please check backend status.');
    } finally {
      setScanning(false);
    }
  };

  const loadSample = (sample) => {
    setMessage(sample.message);
    setError('');
    setResult(null);
  };

  const handleReset = () => {
    setMessage('');
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          SMS Scam (Smishing) Scanner
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Detect delivery redelivery fee traps, fraudulent bank 2FA intercept notices, and predatory sweepstake schemes.
        </p>
      </div>

      {/* Synthetic Demo Presets */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hackathon Demo Presets (1-Click Safe Samples):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SMS_SAMPLES.map((sample, idx) => (
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              SMS Message Text <span className="text-indigo-400">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {message.length} characters
            </span>
          </div>
          <textarea
            id="sms-message-input"
            rows={5}
            placeholder="Paste suspicious text message or SMS content here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition"
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
            Clear Text
          </button>

          <button
            id="sms-scan-btn"
            type="submit"
            disabled={scanning || !message.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-indigo-950 flex items-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Threat Patterns...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze SMS</span>
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
