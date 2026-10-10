import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Scan, 
  Mail, 
  MessageSquare, 
  Globe, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Clock, 
  CheckCircle2,
  FileQuestion
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { apiService } from '../services/api';
import { ScanResultCard } from '../components/ScanResultCard';

const COLORS = {
  High: '#f43f5e',
  Medium: '#f59e0b',
  Low: '#10b981',
};

export const Dashboard = ({ setActiveTab, stats, onRefreshStats }) => {
  const [quickInput, setQuickInput] = useState('');
  const [quickScanning, setQuickScanning] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [quickError, setQuickError] = useState('');

  const chartData = [
    { name: 'High Risk', value: stats.high, color: COLORS.High },
    { name: 'Medium Risk', value: stats.medium, color: COLORS.Medium },
    { name: 'Low Risk', value: stats.low, color: COLORS.Low },
  ].filter(d => d.value > 0);

  const handleQuickScan = async (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setQuickScanning(true);
    setQuickError('');
    setQuickResult(null);

    try {
      const text = quickInput.trim();
      let res;
      // Auto-detect if URL or text message
      if (text.startsWith('http://') || text.startsWith('https://') || text.includes('www.') || text.includes('.com') || text.includes('.org') || text.includes('.xyz')) {
        res = await apiService.analyzeUrl(text);
      } else {
        res = await apiService.analyzeSms({ message: text });
      }
      setQuickResult(res);
      onRefreshStats();
    } catch (err) {
      setQuickError(err.response?.data?.detail || err.message || 'Quick scan failed. Please check backend status.');
    } finally {
      setQuickScanning(false);
    }
  };

  const loadSyntheticDemo = async () => {
    setQuickScanning(true);
    setQuickError('');
    try {
      const demoUrl = 'http://paypal-verification-center.top/webscr';
      setQuickInput(demoUrl);
      const res = await apiService.analyzeUrl(demoUrl);
      setQuickResult(res);
      onRefreshStats();
    } catch (err) {
      setQuickError(err.message);
    } finally {
      setQuickScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome & Quick Scanner Banner */}
      <div className="cyber-card rounded-2xl p-6 lg:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Hackathon Live Evaluation Edition
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Autonomous Phishing & Fraud Threat Intelligence
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Protect against social engineering attacks across emails, SMS messages, malicious links, and weaponized QR codes with deep heuristic inspection.
          </p>
        </div>

        {/* Quick Scan Input */}
        <form onSubmit={handleQuickScan} className="mt-6 max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="quick-scan-input"
                type="text"
                placeholder="Enter suspicious URL or paste message snippet to analyze..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
            <button
              id="quick-scan-btn"
              type="submit"
              disabled={quickScanning || !quickInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
            >
              {quickScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Quick Scan</span>
                </>
              )}
            </button>
          </div>
          {quickError && (
            <p className="text-xs text-rose-400 mt-2">{quickError}</p>
          )}
        </form>
      </div>

      {/* Quick Scan Result Display (if executed) */}
      {quickResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Quick Scan Result
            </h3>
            <button
              onClick={() => setQuickResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <ScanResultCard result={quickResult} onScanAgain={() => setQuickResult(null)} />
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Scans</span>
            <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Client-side verifiable history
          </span>
        </div>

        {/* High Risk */}
        <div className="cyber-card p-5 rounded-2xl border border-rose-950/40 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium">High Risk</span>
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-rose-400 mt-2">
            {stats.high}
          </p>
          <span className="text-[11px] text-rose-300/60 mt-1 block">
            Critical threats identified
          </span>
        </div>

        {/* Medium Risk */}
        <div className="cyber-card p-5 rounded-2xl border border-amber-950/40 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Medium Risk</span>
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-amber-400 mt-2">
            {stats.medium}
          </p>
          <span className="text-[11px] text-amber-300/60 mt-1 block">
            Suspicious indicators flagged
          </span>
        </div>

        {/* Low Risk */}
        <div className="cyber-card p-5 rounded-2xl border border-emerald-950/40 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Low Risk</span>
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-emerald-400 mt-2">
            {stats.low}
          </p>
          <span className="text-[11px] text-emerald-300/60 mt-1 block">
            Safe or benign scans
          </span>
        </div>
      </div>

      {/* Middle Grid: Launchpad & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 4 Dedicated Scanner Launchpads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Targeted Scanners
            </h3>
            <span className="text-xs text-slate-400">
              Choose an inspection vector
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Scanner Card */}
            <div
              id="launch-email"
              onClick={() => setActiveTab('email')}
              className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mb-3 group-hover:scale-105 transition">
                <Mail className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition flex items-center justify-between">
                Email Phishing Scanner
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Deconstruct email headers, urgency pressure, credential harvesting, and spoofed senders.
              </p>
            </div>

            {/* SMS Scanner Card */}
            <div
              id="launch-sms"
              onClick={() => setActiveTab('sms')}
              className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit mb-3 group-hover:scale-105 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition flex items-center justify-between">
                SMS Scam Scanner
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Detect delivery fee traps, fake prize lotteries, and bank 2FA OTP intercept scams.
              </p>
            </div>

            {/* URL Scanner Card */}
            <div
              id="launch-url"
              onClick={() => setActiveTab('url')}
              className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit mb-3 group-hover:scale-105 transition">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition flex items-center justify-between">
                URL Threat Analyzer
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Inspect IP hostnames, @ userinfo trickery, homograph punycode, and lookalike domains safely.
              </p>
            </div>

            {/* QR Scanner Card */}
            <div
              id="launch-qr"
              onClick={() => setActiveTab('qr')}
              className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit mb-3 group-hover:scale-105 transition">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition flex items-center justify-between">
                QR Code Decoder
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Safely decode QR images using computer vision and scan payloads for quishing attacks.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Risk Distribution Chart or Empty State */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Risk Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proportion of detected threat severity
            </p>
          </div>

          {stats.total === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                <FileQuestion className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400 font-medium">No scans recorded yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Perform your first scan or run a synthetic attack demo to populate live metrics.
              </p>
              <button
                onClick={loadSyntheticDemo}
                className="mt-4 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition"
              >
                Run First Demo Scan
              </button>
            </div>
          ) : (
            <div className="py-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="block text-rose-400 font-bold">{stats.high}</span>
                  <span className="text-[10px] text-slate-400">High</span>
                </div>
                <div>
                  <span className="block text-amber-400 font-bold">{stats.medium}</span>
                  <span className="text-[10px] text-slate-400">Medium</span>
                </div>
                <div>
                  <span className="block text-emerald-400 font-bold">{stats.low}</span>
                  <span className="text-[10px] text-slate-400">Low</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Scan Engine Heuristics</span>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Scans History Preview */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Recent Security Scans
          </h3>
          {stats.total > 0 && (
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All ({stats.total})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {stats.total === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
            <p className="text-xs text-slate-400">
              No recent scans available. Choose a scanner above to begin analyzing content.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {stats.history.slice(0, 5).map((scan) => (
              <div key={scan.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    scan.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    scan.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {scan.severity}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {scan.target_preview}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                      {scan.input_type} • Score: {scan.score}/100 • {new Date(scan.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setQuickResult(scan)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition shrink-0"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
