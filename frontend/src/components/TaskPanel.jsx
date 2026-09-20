import React from 'react';
import { Play, CheckCircle2, Clock, AlertCircle, FileText, UserCheck, Box, Fingerprint, Loader2 } from 'lucide-react';

export default function TaskPanel({ task, onRunTask, isRunning, activeCapsCount = 2 }) {
  if (!task) {
    return (
      <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
        <FileText className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <div className="text-sm font-semibold text-slate-400">Initializing Task Scope...</div>
        <div className="text-xs text-slate-600 mt-1">Establishing minimal capability envelope</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Clock className="w-3 h-3 mr-1" /> RUNNING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 mr-1" /> FAILED
          </span>
        );
      default:
        return (
          <span className="badge bg-slate-800 text-slate-300 border border-slate-700">
            {status || 'CREATED'}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Task Scope &amp; Identity
            </span>
          </div>
          {getStatusBadge(task.status)}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              Agent Principal:
            </span>
            <span className="font-mono font-bold text-white text-xs">{task.agent_id}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              Task Context:
            </span>
            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[190px]">
              {task.task_id}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/[0.06] text-[11px] text-slate-300 leading-relaxed">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Objective:</span>
            {task.description}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">
          Caps: <span className="text-emerald-400 font-bold">{activeCapsCount} Active</span>
        </span>

        {task.status === 'CREATED' && (
          <button
            onClick={() => onRunTask(task.task_id)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Task'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
