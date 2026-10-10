import React from 'react';
import { Menu, Shield, Zap, Sparkles } from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';

export const Header = ({ activeTab, setIsOpen, onQuickDemo }) => {
  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 bg-[#070b14]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-['Outfit']">
            {currentNav.label}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            Intelligent Multi-Vector Phishing & Scam Defense System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Demo CTA */}
        {onQuickDemo && (
          <button
            onClick={onQuickDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Demo Attack</span>
          </button>
        )}

        {/* Engine status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Local Engine Active</span>
        </div>
      </div>
    </header>
  );
};
