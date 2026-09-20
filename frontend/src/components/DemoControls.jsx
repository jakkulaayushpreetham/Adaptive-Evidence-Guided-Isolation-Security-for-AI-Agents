import React, { useState } from 'react';
import { Play, PlusCircle, Globe, FileWarning, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';

export default function DemoControls({
  onCreateDemoTask,
  onRunNormalTask,
  onSimulateAttack,
  onResetDemo,
  isTaskActive,
  isRunning,
  isCritical,
}) {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (name, fn) => {
    try {
      setLoadingAction(name);
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="soc-card">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Authoritative Demonstration Controls
          </span>
        </div>
        <span className="text-[11px] text-slate-500 mono">
          Live SecurityRuntime Execution Gateway
        </span>
      </div>

      <div className="space-y-3">
        {/* Row 1: Task Lifecycle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleAction('create', onCreateDemoTask)}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            Create Demo Task
          </button>

          <button
            onClick={() => handleAction('run', onRunNormalTask)}
            disabled={!isTaskActive || isRunning || isCritical || loadingAction !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Normal Task
          </button>
        </div>

        {/* Row 2: Security Attacks */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Adversarial Probes &amp; Security Violations:
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() =>
                handleAction('network', () =>
                  onSimulateAttack('NETWORK', 'https://exfiltrate-data.org/leak')
                )
              }
              disabled={!isTaskActive || isCritical || loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/60 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              Attempt Unauthorized Network
            </button>

            <button
              onClick={() =>
                handleAction('private_read', () =>
                  onSimulateAttack('READ_FILE', '/workspace/private/credentials.env')
                )
              }
              disabled={!isTaskActive || isCritical || loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/60 transition-colors"
            >
              <FileWarning className="w-3.5 h-3.5 text-rose-400" />
              Attempt Private File Read
            </button>

            <button
              onClick={() =>
                handleAction('write', () =>
                  onSimulateAttack('WRITE_FILE', '/workspace/output/tamper.txt')
                )
              }
              disabled={!isTaskActive || isCritical || loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 disabled:opacity-40 text-amber-300 rounded-lg text-xs font-medium border border-amber-800/60 transition-colors"
            >
              <FileWarning className="w-3.5 h-3.5 text-amber-400" />
              Attempt Revoked Write
            </button>

            <button
              onClick={() => handleAction('reset', onResetDemo)}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium border border-slate-800 transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Reset Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
