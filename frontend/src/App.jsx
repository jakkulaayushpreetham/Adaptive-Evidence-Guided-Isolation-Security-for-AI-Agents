import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import AgentDetails from './pages/AgentDetails';
import TaskDetails from './pages/TaskDetails';
import IncidentHistory from './pages/IncidentHistory';
import { Shield, LayoutDashboard, UserCheck, FileText, History } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const activeTaskId = localStorage.getItem('aegis_active_task_id');

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-[#0d121f]/80 backdrop-blur-md px-6 py-2.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-white text-sm tracking-wider">
            <Shield className="w-5 h-5 text-sky-400" />
            <span>AEGIS-AI</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              SOC Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'agent'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Agent Details
            </button>

            <button
              onClick={() => setCurrentTab('task')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'task'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Task Scope
            </button>

            <button
              onClick={() => setCurrentTab('incident')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'incident'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Trail
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs mono text-slate-500">
          <span>D-S FUSION KERNEL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'agent' && <AgentDetails taskId={activeTaskId} />}
        {currentTab === 'task' && <TaskDetails taskId={activeTaskId} />}
        {currentTab === 'incident' && <IncidentHistory taskId={activeTaskId} />}
      </main>
    </div>
  );
}
