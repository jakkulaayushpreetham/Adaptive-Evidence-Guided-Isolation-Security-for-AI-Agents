import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AgentDetails from './pages/AgentDetails';
import TaskDetails from './pages/TaskDetails';
import IncidentHistory from './pages/IncidentHistory';
import { Shield, LayoutDashboard, UserCheck, FileText, History, Cpu, Activity, Clock } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState('');
  const activeTaskId = localStorage.getItem('aegis_active_task_id');

  // Live ticking cyber clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070e] text-slate-100 flex flex-col selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Master Top Cyber Command Bar */}
      <nav className="border-b border-white/[0.08] bg-[#080c18]/85 backdrop-blur-2xl px-4 lg:px-7 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-[1.5px] shadow-[0_0_20px_rgba(14,165,233,0.45)]">
                <div className="w-full h-full bg-[#090d1c] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090d1c] animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  AEGIS-AI
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold tracking-wider">
                  OS DEFENSE SOC
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                Adaptive OS Security Architecture &bull; Dempster-Shafer Trust Kernel
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-white/[0.06] backdrop-blur-md">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>SOC Command Deck</span>
            </button>

            <button
              onClick={() => setCurrentTab('agent')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'agent'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Agent Principal</span>
            </button>

            <button
              onClick={() => setCurrentTab('task')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'task'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Task Scope</span>
            </button>

            <button
              onClick={() => setCurrentTab('incident')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'incident'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Provenance</span>
            </button>
          </div>
        </div>

        {/* Right Telemetry & Clock */}
        <div className="flex items-center gap-3">
          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '00:00:00 UTC'}</span>
          </div>

          {/* Kernel Active Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="font-mono text-[11px] text-emerald-300 font-bold tracking-wider">
              KERNEL ACTIVE
            </span>
          </div>

          {/* D-S Fusion Version */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-bold">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>D-S FUSION &Theta;=&#123;T,U&#125;</span>
          </div>
        </div>
      </nav>

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-[1780px] mx-auto p-4 lg:p-6">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'agent' && <AgentDetails taskId={activeTaskId} />}
        {currentTab === 'task' && <TaskDetails taskId={activeTaskId} />}
        {currentTab === 'incident' && <IncidentHistory taskId={activeTaskId} />}
      </main>
    </div>
  );
}
