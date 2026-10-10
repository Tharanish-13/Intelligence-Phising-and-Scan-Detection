import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { EmailScanner } from './pages/EmailScanner';
import { SmsScanner } from './pages/SmsScanner';
import { UrlScanner } from './pages/UrlScanner';
import { QrScanner } from './pages/QrScanner';
import { ScanHistory } from './pages/ScanHistory';
import { SecurityAwareness } from './pages/SecurityAwareness';
import { apiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0, history: [] });

  const refreshStats = () => {
    const s = apiService.getStats();
    setStats(s);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleQuickDemo = () => {
    setActiveTab('url');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex font-['Inter',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        scanCount={stats.total}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          setIsOpen={setSidebarOpen}
          onQuickDemo={handleQuickDemo}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              stats={stats}
              onRefreshStats={refreshStats}
            />
          )}

          {activeTab === 'email' && (
            <EmailScanner onScanComplete={refreshStats} />
          )}

          {activeTab === 'sms' && (
            <SmsScanner onScanComplete={refreshStats} />
          )}

          {activeTab === 'url' && (
            <UrlScanner onScanComplete={refreshStats} />
          )}

          {activeTab === 'qr' && (
            <QrScanner onScanComplete={refreshStats} />
          )}

          {activeTab === 'history' && (
            <ScanHistory
              history={stats.history}
              onRefresh={refreshStats}
            />
          )}

          {activeTab === 'awareness' && (
            <SecurityAwareness />
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-900 bg-[#070b14] px-6 py-4 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>PhishGuard AI — Intelligent Phishing & Scam Detection Platform</span>
            <span className="font-mono text-[11px] text-slate-400">Heuristic Engine v1.0.0 • Client-side Verified History</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
