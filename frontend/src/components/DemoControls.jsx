import React, { useState } from 'react';
import { Play, PlusCircle, Globe, FileWarning, ShieldAlert, RotateCcw, AlertTriangle, ShieldCheck, Terminal, Loader2 } from 'lucide-react';

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
    <div className="soc-card relative overflow-hidden bg-gradient-to-r from-slate-900/95 via-[#0d1424]/95 to-slate-900/95 border border-sky-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      {/* Background cyber accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Console Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide uppercase">
                Interactive Security Gateway
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mono font-semibold">
                HOT-PATH CONTROLS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live Reference Monitor &amp; Autonomous Agent Tool Gateway Execution
            </p>
          </div>
        </div>

        {/* Right: Action Button Groups */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Task Operations */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
            <button
              onClick={() => handleAction('create', onCreateDemoTask)}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700/80 transition-all hover:scale-[1.02] shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'create' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>New Task</span>
            </button>

            <button
              onClick={() => handleAction('run', onRunNormalTask)}
              disabled={!isTaskActive || isRunning || isCritical || loadingAction !== null}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {isRunning || loadingAction === 'run' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Execute Task</span>
            </button>
          </div>

          {/* Adversarial Attacks Group */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
            <button
              onClick={() =>
                handleAction('network', () =>
                  onSimulateAttack('NETWORK', 'https://exfiltrate.example.org')
                )
              }
              disabled={!isTaskActive || isCritical || loadingAction !== null}
              title="Attempts unauthorized outbound network probe"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/50 hover:border-rose-600/80 transition-all cursor-pointer disabled:opacity-40"
            >
              {loadingAction === 'network' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Probe Network</span>
            </button>

            <button
              onClick={() =>
                handleAction('private_read', () =>
                  onSimulateAttack('READ_FILE', '/workspace/private/credentials.env')
                )
              }
              disabled={!isTaskActive || isCritical || loadingAction !== null}
              title="Attempts unauthorized private credentials file read"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/50 hover:border-rose-600/80 transition-all cursor-pointer disabled:opacity-40"
            >
              {loadingAction === 'private_read' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <FileWarning className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Private File Read</span>
            </button>

            <button
              onClick={() =>
                handleAction('write', () =>
                  onSimulateAttack('WRITE_FILE', '/workspace/output/summary.txt')
                )
              }
              disabled={!isTaskActive || isCritical || loadingAction !== null}
              title="Attempts write to summary file (tests post-revocation denial)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 rounded-lg text-xs font-medium border border-amber-800/50 hover:border-amber-600/80 transition-all cursor-pointer disabled:opacity-40"
            >
              {loadingAction === 'write' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Test Revoked Write</span>
            </button>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={() => handleAction('reset', onResetDemo)}
            disabled={loadingAction !== null}
            title="Reset active agent, task, and security state to clean baseline"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl text-xs font-medium border border-slate-800 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingAction === 'reset' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
