import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Mail, 
  MessageSquare, 
  Globe, 
  QrCode, 
  History, 
  GraduationCap, 
  Activity,
  X
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'email', label: 'Email Scanner', icon: Mail },
  { id: 'sms', label: 'SMS Scanner', icon: MessageSquare },
  { id: 'url', label: 'URL Scanner', icon: Globe },
  { id: 'qr', label: 'QR Scanner', icon: QrCode },
  { id: 'history', label: 'Scan History', icon: History },
  { id: 'awareness', label: 'Security Awareness', icon: GraduationCap },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, scanCount = 0 }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top: Brand Logo */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-wide text-white font-['Outfit']">
                  PhishGuard<span className="text-cyan-400">AI</span>
                </span>
                <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Threat Detection
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950/40 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'history' && scanCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                      {scanCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Engine Health & Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Heuristic Engine Online
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>FastAPI Core</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
