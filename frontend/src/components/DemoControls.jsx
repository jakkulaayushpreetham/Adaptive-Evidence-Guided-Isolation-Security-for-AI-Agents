import React, { useState } from 'react';
import {
  Play,
  PlusCircle,
  Globe,
  FileWarning,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Loader2,
  Sparkles,
  Zap,
  Lock,
  Flame,
  CheckCircle2,
} from 'lucide-react';

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
  const [autoDemoActive, setAutoDemoActive] = useState(false);
  const [autoStep, setAutoStep] = useState(0);

  const handleAction = async (name, fn) => {
    try {
      setLoadingAction(name);
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  // Automated 4-step presentation sequence for jury / thesis defense
  const runAutoShowcase = async () => {
    if (autoDemoActive) return;
    setAutoDemoActive(true);

    try {
      // Step 1: Clean Reset & Provision Task
      setAutoStep(1);
      await onCreateDemoTask();
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Legitimate Task Execution
      setAutoStep(2);
      await onRunNormalTask();
      await new Promise((r) => setTimeout(r, 1500));

      // Step 3: Adversarial Network Probe (Blocked)
      setAutoStep(3);
      await onSimulateAttack('NETWORK', 'https://exfiltrate.example.org');
      await new Promise((r) => setTimeout(r, 1500));

      // Step 4: Private File Harvesting (D-S Fusion -> Restricted)
      setAutoStep(4);
      await onSimulateAttack('READ_FILE', '/workspace/private/credentials.env');
      await new Promise((r) => setTimeout(r, 1800));

      // Step 5: Revoked Capability Write (Critical Containment)
      setAutoStep(5);
      await onSimulateAttack('WRITE_FILE', '/workspace/output/summary.txt');
    } catch (err) {
      console.error('Auto showcase demo error:', err);
    } finally {
      setAutoDemoActive(false);
      setAutoStep(0);
    }
  };

  return (
    <div className="glass-hero p-4 relative overflow-hidden bg-gradient-to-r from-slate-900/95 via-[#0b1020]/95 to-slate-900/95 border border-sky-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
      {/* Background cyber ambient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Console Branding & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <ShieldAlert className="w-5 h-5 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white tracking-wide uppercase">
                Adversarial Defense Simulator
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 font-mono font-bold tracking-wider">
                HOT-PATH GATEWAY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Direct Reference Monitor Interception &bull; Adaptive Policy Enforcement Pipeline
            </p>
          </div>
        </div>

        {/* Right: Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Automated Showcase Playback Button */}
          <button
            onClick={runAutoShowcase}
            disabled={autoDemoActive || loadingAction !== null}
            title="One-click end-to-end showcase: Baseline -> Network Probe -> Private Read -> Revoked Write"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 border border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoDemoActive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span className="font-mono">Demo Step {autoStep}/5 Running...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300 fill-current" />
                <span>One-Click Defense Showcase</span>
              </>
            )}
          </button>

          {/* Group 1: Task Lifecycle Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <button
              onClick={() => handleAction('create', onCreateDemoTask)}
              disabled={autoDemoActive || loadingAction !== null}
              title="Spawn fresh agent principal with minimal task-scoped capabilities"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-750 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700/80 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40"
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
              disabled={!isTaskActive || isRunning || isCritical || autoDemoActive || loadingAction !== null}
              title="Execute validated compliant task operations (Scoped READ + WRITE)"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {isRunning || loadingAction === 'run' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Legitimate Run</span>
            </button>
          </div>

          {/* Group 2: Adversarial Attack Probes */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <button
              onClick={() =>
                handleAction('network', () =>
                  onSimulateAttack('NETWORK', 'https://exfiltrate.example.org')
                )
              }
              disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
              title="Adversarial Probe 1: Unauthorized outbound network exfiltration attempt"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 hover:border-rose-600/90 transition-all cursor-pointer disabled:opacity-40"
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
              disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
              title="Adversarial Probe 2: Unauthorized credential file read (Triggers RESTRICTED state)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 hover:border-rose-600/90 transition-all cursor-pointer disabled:opacity-40"
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
              disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
              title="Adversarial Probe 3: Attempt write post-revocation (Escalates to CRITICAL container containment)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded-lg text-xs font-semibold border border-amber-800/60 hover:border-amber-600/90 transition-all cursor-pointer disabled:opacity-40"
            >
              {loadingAction === 'write' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Test Revoked Write</span>
            </button>
          </div>

          {/* Group 3: System Reset */}
          <button
            onClick={() => handleAction('reset', onResetDemo)}
            disabled={autoDemoActive || loadingAction !== null}
            title="Clean reset: Reset agent, trust belief, event queue, and capabilities back to virgin baseline"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'reset' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
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
