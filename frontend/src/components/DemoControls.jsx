import React, { useState } from 'react';
import {
  Play,
  PlusCircle,
  Globe,
  FileWarning,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Sparkles,
  Radio,
  Lock,
  ChevronRight,
} from 'lucide-react';

export default function DemoControls({
  onCreateDemoTask,
  onRunNormalTask,
  onSimulateAttack,
  onResetDemo,
  onOpenEventInjector,
  isTaskActive,
  isRunning,
  isCritical,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [autoDemoActive, setAutoDemoActive] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  const handleAction = async (name, fn) => {
    try {
      setLoadingAction(name);
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  const runAutoShowcase = async () => {
    if (autoDemoActive) return;
    setAutoDemoActive(true);

    try {
      setActiveStep(1);
      await onCreateDemoTask();
      await new Promise((r) => setTimeout(r, 1400));

      setActiveStep(2);
      await onRunNormalTask();
      await new Promise((r) => setTimeout(r, 1600));

      setActiveStep(3);
      await onSimulateAttack('NETWORK', 'https://exfiltrate.example.org');
      await new Promise((r) => setTimeout(r, 1600));

      setActiveStep(4);
      await onSimulateAttack('READ_FILE', '/workspace/private/credentials.env');
      await new Promise((r) => setTimeout(r, 1800));

      setActiveStep(5);
      await onSimulateAttack('WRITE_FILE', '/workspace/output/summary.txt');
    } catch (err) {
      console.error('Showcase demo error:', err);
    } finally {
      setAutoDemoActive(false);
      setActiveStep(null);
    }
  };

  return (
    <div className="glass-panel p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/[0.08] bg-[#0a0f1d]/90 shadow-lg">
      {/* Left: Quick Execution Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Provision Task */}
        <button
          onClick={() => handleAction('create', onCreateDemoTask)}
          disabled={autoDemoActive || loadingAction !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-white/[0.08] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40"
        >
          {loadingAction === 'create' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>New Task</span>
        </button>

        {/* Normal Scoped Execution */}
        <button
          onClick={() => handleAction('run', onRunNormalTask)}
          disabled={!isTaskActive || isRunning || isCritical || autoDemoActive || loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
        >
          {isRunning || loadingAction === 'run' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Execute Task</span>
        </button>

        <div className="h-5 w-[1px] bg-white/[0.1] mx-0.5 hidden sm:block" />

        {/* Attack Probes (Fast Hot-Path Triggers) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              handleAction('network', () =>
                onSimulateAttack('NETWORK', 'https://exfiltrate.example.org')
              )
            }
            disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
            title="Attempts unauthorized outbound network connection"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg text-xs font-medium border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'network' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Network Egress</span>
          </button>

          <button
            onClick={() =>
              handleAction('private_read', () =>
                onSimulateAttack('READ_FILE', '/workspace/private/credentials.env')
              )
            }
            disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
            title="Attempts unauthorized credentials read (Triggers RESTRICTED)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-lg text-xs font-medium border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'private_read' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <FileWarning className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Credential Breach</span>
          </button>

          <button
            onClick={() =>
              handleAction('write', () =>
                onSimulateAttack('WRITE_FILE', '/workspace/output/summary.txt')
              )
            }
            disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
            title="Attempts write to summary file (Tests post-revocation denial)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-medium border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'write' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>Revoked Write</span>
          </button>
        </div>
      </div>

      {/* Right: Suite Actions (Simulator & Automated Demo) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenEventInjector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>Event Injector</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            16+
          </span>
        </button>

        <button
          onClick={runAutoShowcase}
          disabled={autoDemoActive || loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all cursor-pointer disabled:opacity-40"
        >
          {autoDemoActive ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span className="font-mono">Demo Step {activeStep}/5...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 fill-current" />
              <span>Showcase Demo</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleAction('reset', onResetDemo)}
          disabled={autoDemoActive || loadingAction !== null}
          title="Reset task and security state"
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40"
        >
          {loadingAction === 'reset' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
