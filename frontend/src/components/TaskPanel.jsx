import React from 'react';
import { Play, CheckCircle2, Clock, AlertCircle, FileText, UserCheck, Box, Fingerprint } from 'lucide-react';

export default function TaskPanel({ task, onRunTask, isRunning, activeCapsCount = 2 }) {
  if (!task) {
    return (
      <div className="soc-card flex flex-col justify-center items-center text-center p-6">
        <FileText className="w-8 h-8 text-slate-600 mb-2" />
        <div className="text-sm font-semibold text-slate-400">No Active Task Context</div>
        <div className="text-xs text-slate-600 mt-1">Create a demo task to initialize capability envelope</div>
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
    <div className="soc-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Task Scope &amp; Identity
            </span>
          </div>
          {getStatusBadge(task.status)}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              Agent Principal:
            </span>
            <span className="mono font-bold text-slate-100">{task.agent_id}</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              Task Context:
            </span>
            <span className="mono text-slate-300 text-[11px] truncate max-w-[180px]">{task.task_id}</span>
          </div>

          <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
            {task.description}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 mono">
          Caps: <span className="text-emerald-400 font-bold">{activeCapsCount} Active</span>
        </span>

        {task.status === 'CREATED' && (
          <button
            onClick={() => onRunTask(task.task_id)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all hover:scale-102 shadow-sm cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            {isRunning ? 'Running...' : 'Run Task'}
          </button>
        )}
      </div>
    </div>
  );
}
