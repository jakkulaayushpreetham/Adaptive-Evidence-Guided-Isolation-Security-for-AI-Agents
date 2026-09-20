import React from 'react';
import { Play, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';

export default function TaskPanel({ task, onRunTask, isRunning }) {
  if (!task) {
    return (
      <div className="soc-card flex flex-col justify-center items-center text-center p-6">
        <FileText className="w-8 h-8 text-slate-600 mb-2" />
        <div className="text-sm font-medium text-slate-400">No Active Task Selected</div>
        <div className="text-xs text-slate-600 mt-1">Create a demo task to initiate capability bounds</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="badge bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
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
          <span className="badge bg-slate-800 text-slate-400 border border-slate-700">
            {status || 'CREATED'}
          </span>
        );
    }
  };

  return (
    <div className="soc-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Task Scope
            </span>
          </div>
          {getStatusBadge(task.status)}
        </div>

        <div className="mono text-xs text-slate-500 mb-1">ID: {task.task_id}</div>
        <div className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
          {task.description}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-[11px] text-slate-400">
          Agent: <span className="mono text-slate-200 font-semibold">{task.agent_id}</span>
        </div>
        {task.status === 'CREATED' && (
          <button
            onClick={() => onRunTask(task.task_id)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            {isRunning ? 'Running...' : 'Execute Task'}
          </button>
        )}
      </div>
    </div>
  );
}
