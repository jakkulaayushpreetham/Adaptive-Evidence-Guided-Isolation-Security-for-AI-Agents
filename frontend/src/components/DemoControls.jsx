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
  ArrowRight,
  Info,
  CheckCircle2,
  Lock,
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
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [liveNarrative, setLiveNarrative] = useState('');

  const handleAction = async (name, stepNum, narrative, fn) => {
    try {
      setLoadingAction(name);
      setLiveNarrative(narrative);
      await fn();
      setCurrentStepIndex(Math.min(5, stepNum + 1));
    } finally {
      setLoadingAction(null);
    }
  };

  // Automated 5-step guided demonstration
  const runAutoShowcase = async () => {
    if (autoDemoActive) return;
    setAutoDemoActive(true);

    try {
      // Step 1: Initialize
      setCurrentStepIndex(1);
      setLiveNarrative('Step 1/5: Provisioning new autonomous agent with minimal task permissions...');
      await onCreateDemoTask();
      await new Promise((r) => setTimeout(r, 1500));

      // Step 2: Legitimate Run
      setCurrentStepIndex(2);
      setLiveNarrative('Step 2/5: Agent running authorized task (READ input & WRITE summary). Trusting belief increases...');
      await onRunNormalTask();
      await new Promise((r) => setTimeout(r, 1800));

      // Step 3: Network Probe
      setCurrentStepIndex(3);
      setLiveNarrative('Step 3/5: Agent attempting unauthorized outbound network connection. Reference Monitor blocks it...');
      await onSimulateAttack('NETWORK', 'https://exfiltrate.example.org');
      await new Promise((r) => setTimeout(r, 1800));

      // Step 4: Private File Breach
      setCurrentStepIndex(4);
      setLiveNarrative('Step 4/5: Agent attempting unauthorized private credentials read. Suspicion exceeds 60% -> Policy Engine REVOKES WRITE permission!');
      await onSimulateAttack('READ_FILE', '/workspace/private/credentials.env');
      await new Promise((r) => setTimeout(r, 2000));

      // Step 5: Revoked Capability Write
      setCurrentStepIndex(5);
      setLiveNarrative('Step 5/5: Agent attempting write using revoked capability. Immediate denial -> State becomes CRITICAL -> Containment triggered!');
      await onSimulateAttack('WRITE_FILE', '/workspace/output/summary.txt');
      setLiveNarrative('✅ Demo Complete! All dynamic security invariants successfully demonstrated.');
    } catch (err) {
      console.error('Auto showcase demo error:', err);
      setLiveNarrative('Demo interrupted by error.');
    } finally {
      setAutoDemoActive(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoadingAction('reset');
      setLiveNarrative('System reset to baseline. Ready for Step 1.');
      setCurrentStepIndex(1);
      await onResetDemo();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="glass-hero p-5 relative overflow-hidden bg-gradient-to-r from-slate-900/95 via-[#0c1224]/95 to-slate-900/95 border border-sky-500/25 shadow-[0_12px_45px_rgba(0,0,0,0.7)]">
      {/* Ambient glowing top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />

      {/* Header Row: Title & High-Level Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
                  Interactive Security Lab &amp; Attack Simulator
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 font-mono font-bold">
                  STEP-BY-STEP WORKFLOW
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute the 5 numbered steps below in order to observe how AEGIS-AI verifies, restricts, and isolates an AI agent.
              </p>
            </div>
          </div>
        </div>

        {/* Play Demo & Reset Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={runAutoShowcase}
            disabled={autoDemoActive || loadingAction !== null}
            title="Automatically executes Steps 1 through 5 with live explanations"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 border border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {autoDemoActive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span className="font-mono">Auto Demo Running...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300 fill-current" />
                <span>Play Full Automated Demo</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={autoDemoActive || loadingAction !== null}
            title="Reset system, agent, capabilities, and trust belief back to Step 1"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'reset' ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Reset System</span>
          </button>
        </div>
      </div>

      {/* Live Narrative Banner (When Running Actions) */}
      {liveNarrative && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-medium text-cyan-200 flex items-center gap-2 animate-fadeIn">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{liveNarrative}</span>
        </div>
      )}

      {/* 5-Step Action Grid (Clear, Numbered, Descriptive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {/* STEP 1: Create Task */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
            currentStepIndex === 1
              ? 'bg-cyan-950/30 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
              : 'bg-slate-950/60 border-white/[0.06] opacity-85'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                STEP 1
              </span>
              {currentStepIndex === 1 && (
                <span className="text-[9px] font-bold text-cyan-400 animate-pulse uppercase">
                  Start Here
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white mb-0.5">Initialize Task</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Spawns agent with minimal task-scoped permissions: <code className="text-emerald-400">READ</code> &amp; <code className="text-emerald-400">WRITE</code>.
            </p>
          </div>

          <button
            onClick={() =>
              handleAction(
                'create',
                1,
                'Step 1 executed: New task created. Agent provisioned with legitimate least-privilege tokens.',
                onCreateDemoTask
              )
            }
            disabled={autoDemoActive || loadingAction !== null}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold border border-slate-700 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'create' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>① Spawn Agent</span>
          </button>
        </div>

        {/* STEP 2: Legitimate Run */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
            currentStepIndex === 2
              ? 'bg-emerald-950/30 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-slate-950/60 border-white/[0.06] opacity-85'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                STEP 2
              </span>
              {currentStepIndex === 2 && (
                <span className="text-[9px] font-bold text-emerald-400 animate-pulse uppercase">
                  Recommended
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white mb-0.5">Legitimate Work</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Reads input &amp; writes summary. Trust increases; state stays <span className="text-emerald-400 font-bold">NORMAL</span>.
            </p>
          </div>

          <button
            onClick={() =>
              handleAction(
                'run',
                2,
                'Step 2 executed: Authorized read and write succeeded. Trust mass m(T) increased.',
                onRunNormalTask
              )
            }
            disabled={!isTaskActive || isRunning || isCritical || autoDemoActive || loadingAction !== null}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
          >
            {isRunning || loadingAction === 'run' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>② Run Scoped Task</span>
          </button>
        </div>

        {/* STEP 3: Network Exfiltration Probe */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
            currentStepIndex === 3
              ? 'bg-rose-950/30 border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : 'bg-slate-950/60 border-white/[0.06] opacity-85'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                STEP 3
              </span>
              {currentStepIndex === 3 && (
                <span className="text-[9px] font-bold text-rose-400 animate-pulse uppercase">
                  Recommended
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white mb-0.5">Network Attack</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Attempts outbound HTTP request. Blocked immediately by Reference Monitor.
            </p>
          </div>

          <button
            onClick={() =>
              handleAction(
                'network',
                3,
                'Step 3 executed: Outbound socket blocked by Reference Monitor. Suspicion slightly recorded.',
                () => onSimulateAttack('NETWORK', 'https://exfiltrate.example.org')
              )
            }
            disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-950/50 hover:bg-rose-900/70 text-rose-200 rounded-lg text-xs font-bold border border-rose-800/60 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'network' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>③ Probe Network</span>
          </button>
        </div>

        {/* STEP 4: Read Private Credentials (REVOCATION TRIGGER!) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
            currentStepIndex === 4
              ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
              : 'bg-slate-950/60 border-white/[0.06] opacity-85'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40">
                STEP 4 (KEY!)
              </span>
              {currentStepIndex === 4 && (
                <span className="text-[9px] font-bold text-amber-400 animate-pulse uppercase">
                  Revocation Trigger
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-amber-200 mb-0.5">Private File Breach</div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Reads credentials file. Suspicion reaches &ge;60% &rarr; <span className="text-amber-400 font-bold">WRITE capability REVOKED</span>!
            </p>
          </div>

          <button
            onClick={() =>
              handleAction(
                'private_read',
                4,
                'Step 4 executed: Private credentials read attempted! Policy Engine revoked WRITE capability and moved state to RESTRICTED.',
                () => onSimulateAttack('READ_FILE', '/workspace/private/credentials.env')
              )
            }
            disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-extrabold transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'private_read' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileWarning className="w-3.5 h-3.5 text-white" />
            )}
            <span>④ Read Private File</span>
          </button>
        </div>

        {/* STEP 5: Attempt Revoked Write (CRITICAL TRIGGER!) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
            currentStepIndex === 5
              ? 'bg-rose-950/40 border-rose-400/80 shadow-[0_0_25px_rgba(244,63,94,0.3)] ring-1 ring-rose-400/50'
              : 'bg-slate-950/60 border-white/[0.06] opacity-85'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 border border-rose-500/40">
                STEP 5 (LOCKDOWN)
              </span>
              {currentStepIndex === 5 && (
                <span className="text-[9px] font-bold text-rose-400 animate-pulse uppercase">
                  Containment
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-rose-200 mb-0.5">Test Revoked Write</div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Tries writing after revocation. Immediate block &rarr; State becomes <span className="text-rose-400 font-bold">CRITICAL</span> &rarr; Container isolated!
            </p>
          </div>

          <button
            onClick={() =>
              handleAction(
                'write',
                5,
                'Step 5 executed: Agent attempted revoked write! State transitioned to CRITICAL. Container isolation requested.',
                () => onSimulateAttack('WRITE_FILE', '/workspace/output/summary.txt')
              )
            }
            disabled={!isTaskActive || isCritical || autoDemoActive || loadingAction !== null}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-extrabold transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer disabled:opacity-40"
          >
            {loadingAction === 'write' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
            )}
            <span>⑤ Test Revoked Write</span>
          </button>
        </div>
      </div>
    </div>
  );
}
