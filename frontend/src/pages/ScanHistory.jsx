import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Download, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import { ScanResultCard } from '../components/ScanResultCard';

export const ScanHistory = ({ history = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMedium, setFilterMedium] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedScan, setSelectedScan] = useState(null);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.target_preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMedium = filterMedium === 'all' || item.input_type === filterMedium;
    const matchesSeverity = filterSeverity === 'all' || item.severity === filterSeverity;
    return matchesSearch && matchesMedium && matchesSeverity;
  });

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local scan history?')) {
      apiService.clearScanHistory();
      if (onRefresh) onRefresh();
      setSelectedScan(null);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `phishguard_scan_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Local Scan History
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Audit log of verified scans stored locally in client storage ({history.length} records).
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scans by target domain or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Medium Filter */}
          <select
            value={filterMedium}
            onChange={(e) => setFilterMedium(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="all">All Media</option>
            <option value="url">URLs</option>
            <option value="email">Emails</option>
            <option value="sms">SMS</option>
            <option value="qr">QR Codes</option>
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="all">All Severities</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table / List */}
      {filteredHistory.length === 0 ? (
        <div className="cyber-card p-12 rounded-2xl border border-slate-800 text-center">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No matching scan records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {history.length === 0
              ? 'You have not performed any scans yet. Run a scan from the dashboard or individual scanner pages.'
              : 'Try clearing your search query or reset filter dropdowns.'}
          </p>
        </div>
      ) : (
        <div className="cyber-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800/80">
            {filteredHistory.map((scan) => {
              const date = new Date(scan.timestamp);
              return (
                <div
                  key={scan.id}
                  className="p-4 hover:bg-slate-900/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setSelectedScan(scan)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase shrink-0 mt-0.5 ${
                      scan.severity === 'High' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      scan.severity === 'Medium' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {scan.severity} ({scan.score})
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate font-mono">
                        {scan.target_preview}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                        <span className="capitalize text-slate-400 font-semibold">{scan.input_type} Vector</span>
                        <span>•</span>
                        <span>{scan.indicators?.length || 0} Indicators</span>
                        <span>•</span>
                        <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScan(scan);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition shrink-0"
                  >
                    View Report
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedScan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8">
            <button
              onClick={() => setSelectedScan(null)}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <ScanResultCard result={selectedScan} onScanAgain={() => setSelectedScan(null)} />
          </div>
        </div>
      )}
    </div>
  );
};
