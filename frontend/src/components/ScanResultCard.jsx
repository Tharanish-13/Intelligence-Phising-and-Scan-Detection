import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Server, 
  ChevronDown, 
  ChevronUp,
  FileText
} from 'lucide-react';
import { RiskMeter } from './RiskMeter';

export const ScanResultCard = ({ result, onScanAgain }) => {
  const [copied, setCopied] = useState(false);
  const [expandedIndicators, setExpandedIndicators] = useState(true);

  if (!result) return null;

  const {
    id,
    timestamp,
    score,
    severity,
    input_type,
    target_preview,
    indicators = [],
    recommendations = [],
    analysis_method,
    reputation,
    disclaimer
  } = result;

  const copySummary = () => {
    const summary = `[PhishGuard AI Scan Report]\nTarget: ${target_preview}\nType: ${input_type.toUpperCase()}\nRisk Score: ${score}/100 (${severity})\nTriggered Indicators: ${indicators.length}\nTimestamp: ${timestamp}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'High':
        return {
          badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          border: 'border-rose-500/30',
          glow: 'shadow-rose-950/30',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />
        };
      case 'Medium':
        return {
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-950/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      default:
        return {
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-950/30',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
        };
    }
  };

  const style = getSeverityStyle(severity);

  return (
    <div id="scan-result-card" className={`cyber-card rounded-2xl p-6 border ${style.border} shadow-2xl relative overflow-hidden transition-all duration-300`}>
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100 capitalize">
                {input_type} Security Assessment
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${style.badge}`}>
                {severity} Risk
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
              Target: <span className="text-slate-200">{target_preview}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Copy Report Summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Report'}
          </button>
          {onScanAgain && (
            <button
              onClick={onScanAgain}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
            >
              New Scan
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Meter & Method Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
        {/* Left: Risk Meter */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <RiskMeter score={score} severity={severity} size={170} />
          <div className="text-center mt-1">
            <span className="text-xs text-slate-400">
              {score >= 60
                ? 'Multiple critical warning indicators detected'
                : score >= 30
                ? 'Suspicious patterns detected; exercise caution'
                : 'No critical threat heuristics triggered'}
            </span>
          </div>
        </div>

        {/* Center/Right: Diagnostic Details & Reputation */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Detection Method
              </span>
              <p className="text-sm font-semibold text-slate-200 mt-1 capitalize">
                {analysis_method.replace('_', ' ')}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Multi-layer Heuristic Engine
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Reputation Provider
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${reputation?.checked ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <p className="text-sm font-semibold text-slate-200">
                  {reputation?.source || 'Local Heuristic Mode'}
                </p>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5 capitalize">
                Status: {reputation?.status || 'not_configured'}
              </span>
            </div>
          </div>

          {/* Target Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium block mb-1">
              Decoded & Analyzed Content Preview
            </span>
            <p className="text-xs font-mono text-cyan-300/90 break-all bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/60 max-h-24 overflow-y-auto">
              {target_preview}
            </p>
          </div>
        </div>
      </div>

      {/* Triggered Threat Indicators */}
      <div className="mt-6 border-t border-slate-800 pt-5">
        <div className="flex items-center justify-between mb-3 cursor-pointer select-none" onClick={() => setExpandedIndicators(!expandedIndicators)}>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Detected Threat Indicators ({indicators.length})
            </h4>
            <span className="text-xs text-slate-500">
              (Deduplicated Heuristic Findings)
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-200">
            {expandedIndicators ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expandedIndicators && (
          <div className="space-y-2.5 mt-3">
            {indicators.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-xs text-emerald-300">
                  Clean Scan: No suspicious threat vectors or malicious structural patterns were triggered.
                </p>
              </div>
            ) : (
              indicators.map((ind, idx) => (
                <div
                  key={`${ind.code}-${idx}`}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {ind.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
                          {ind.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {ind.description}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap ${
                      ind.weight >= 35 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      ind.weight >= 20 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      +{ind.weight} Wgt
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actionable Recommendations Checklist */}
      {recommendations.length > 0 && (
        <div className="mt-6 border-t border-slate-800 pt-5">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Recommended Safety Actions
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mandatory Security Disclaimer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
        <Info className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Disclaimer:</strong> {disclaimer} Zero heuristic detection can provide 100% certainty. Always verify through authentic corporate channels.
        </p>
      </div>
    </div>
  );
};
