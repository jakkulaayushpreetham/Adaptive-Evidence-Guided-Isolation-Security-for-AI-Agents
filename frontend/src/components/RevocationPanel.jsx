import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  GitBranch,
  Lock,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Clock,
  Layers,
} from 'lucide-react';

export default function RevocationPanel({
  lastViolationEvent,
  securityState,
  trust,
  revokedCaps = [],
}) {
  const [activeTab, setActiveTab] = useState('dag'); // 'dag' | 'ledger'

  const hasRevocation =
    securityState === 'RESTRICTED' ||
    securityState === 'CRITICAL' ||
    revokedCaps.length > 0;

  const massU = trust?.mass?.untrustworthy ?? (securityState === 'CRITICAL' ? 0.88 : 0.061);
  const conflictK = trust?.conflict ?? 0.0;
  const normalizerAlpha = conflictK < 0.999 ? (1 / (1 - conflictK)).toFixed(2) : 'INF';

  // Determine the primary invariant that triggered the state
  const getTriggerReason = () => {
    if (securityState === 'CRITICAL') {
      if (conflictK >= 0.80) return `Severe Conflict Invariant (K = ${conflictK.toFixed(3)} ≥ 0.80)`;
      return `Critical Distrust Invariant (m(U) = ${(massU * 100).toFixed(1)}% ≥ 85.0%)`;
    }
    if (securityState === 'RESTRICTED') {
      if (conflictK >= 0.50) {
        return `High Evidence Conflict Invariant (K = ${conflictK.toFixed(3)} ≥ 0.50)`;
      }
      return `Restricted Distrust Invariant (m(U) = ${(massU * 100).toFixed(1)}% ≥ 60.0%)`;
    }
    return `Invariants Maintained (m(U) < 0.60 ∧ K < 0.50)`;
  };

  const eventDesc = lastViolationEvent
    ? `${lastViolationEvent.operation} ${lastViolationEvent.resource}`
    : securityState === 'CRITICAL'
    ? 'WRITE_FILE /workspace/output/summary.txt'
    : 'READ_FILE /workspace/output/incident_report.json';

  const eventOp = lastViolationEvent?.operation || (securityState === 'CRITICAL' ? 'WRITE_FILE' : 'READ_FILE');
  const eventRes = lastViolationEvent?.resource || (securityState === 'CRITICAL' ? '/workspace/output/summary.txt' : '/workspace/output/incident_report.json');
  const eventReason = lastViolationEvent?.reason || (securityState === 'CRITICAL' ? 'CAPABILITY_REVOKED' : 'RESOURCE_MISMATCH');

  // Estimated violation evidence mass injected by this class of violation
  const violationEvidenceMass = eventReason.includes('HONEYTOKEN')
    ? 0.95
    : eventReason.includes('REVOKED') || eventReason.includes('DRIFT')
    ? 0.85
    : 0.70;

  return (
    <div className="glass-panel p-4 flex flex-col justify-between min-h-[340px] border border-white/[0.12] bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-[#070b14]/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden group">
      {/* Background Accent Gradients */}
      {hasRevocation ? (
        <div className="absolute top-0 right-0 w-72 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      ) : (
        <div className="absolute top-0 right-0 w-72 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      )}

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-white/[0.08] gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border shadow-sm flex items-center justify-center transition-all ${
                securityState === 'CRITICAL'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : hasRevocation
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {securityState === 'CRITICAL' ? (
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              ) : hasRevocation ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                  Revocation Causal Evidence Chain
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.08] font-mono font-semibold">
                  CAUSAL DAG
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono tracking-tight mt-0.5">
                Deterministic Invariant Enforcement &amp; Kernel Actuation
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-white/[0.08] text-[11px] font-mono">
              <button
                onClick={() => setActiveTab('dag')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'dag'
                    ? 'bg-slate-800 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Causal Flow
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ledger'
                    ? 'bg-slate-800 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Revocations</span>
                {revokedCaps.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {revokedCaps.length}
                  </span>
                )}
              </button>
            </div>

            {/* Status Badge */}
            {securityState === 'CRITICAL' ? (
              <span className="badge badge-critical border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                TOTAL QUARANTINE
              </span>
            ) : hasRevocation ? (
              <span className="badge badge-restricted border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                REVOCATION ACTIVE
              </span>
            ) : (
              <span className="badge badge-normal border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                INVARIANTS SATISFIED
              </span>
            )}
          </div>
        </div>

        {/* Tab 1: Causal DAG View */}
        {activeTab === 'dag' && (
          <div className="space-y-2 mt-1">
            {/* Stage 1: Intercepted Syscall Event */}
            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-white/[0.08] hover:border-white/[0.16] transition-all relative overflow-hidden group/stage">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                      1. Intercepted Syscall Event
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                        {eventOp}
                      </span>
                      <span className="text-slate-200 font-mono text-xs font-semibold break-all">
                        {eventRes}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="px-2 py-1 rounded text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/40 font-mono font-bold tracking-wide shadow-sm">
                  {eventReason}
                </span>
              </div>
            </div>

            {/* Connecting Causal Vector */}
            <div className="flex items-center justify-center -my-1 text-slate-600">
              <div className="w-px h-3 bg-gradient-to-b from-rose-500/40 via-amber-500/40 to-transparent" />
            </div>

            {/* Stage 2: Mass Evidence Formulation */}
            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-white/[0.08] hover:border-white/[0.16] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                      2. Dempster-Shafer Evidence Formulation
                    </span>
                    <div className="text-slate-300 text-xs font-mono mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>
                        Sensor Injected Mass: <strong className="text-rose-400 font-bold">m_e(U) = {violationEvidenceMass.toFixed(2)}</strong>
                      </span>
                      <span className="text-slate-500">|</span>
                      <span>
                        Fused Distrust: <strong className="text-amber-300 font-bold">m(U) = {(massU * 100).toFixed(1)}%</strong>
                      </span>
                      <span className="text-slate-500">|</span>
                      <span>
                        Sensor Conflict: <strong className="text-sky-300 font-bold">K = {conflictK.toFixed(3)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06]">
                  &alpha; = {normalizerAlpha}
                </span>
              </div>
            </div>

            {/* Connecting Causal Vector */}
            <div className="flex items-center justify-center -my-1 text-slate-600">
              <div className="w-px h-3 bg-gradient-to-b from-amber-500/40 via-purple-500/40 to-transparent" />
            </div>

            {/* Stage 3: Policy State Transition */}
            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-white/[0.08] hover:border-white/[0.16] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <GitBranch className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                      3. Non-Monotonic Policy Invariant
                    </span>
                    <div className="font-mono text-xs font-bold text-amber-300 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{getTriggerReason()}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                        &rarr; {securityState}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono text-right hidden sm:block">
                  <span>Fail-Closed Bound</span>
                </div>
              </div>
            </div>

            {/* Connecting Causal Vector */}
            <div className="flex items-center justify-center -my-1 text-slate-600">
              <div className="w-px h-3 bg-gradient-to-b from-purple-500/40 via-rose-500/40 to-transparent" />
            </div>

            {/* Stage 4: Enforcement Actuation */}
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 hover:border-rose-500/60 transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block font-mono">
                      4. OS Kernel Actuation &amp; Capability Revocation
                    </span>
                    <div className="font-mono text-xs font-bold text-rose-200 mt-0.5">
                      {securityState === 'CRITICAL'
                        ? 'TOTAL QUARANTINE: ALL LEASES REVOKED • CGROUPS PROCESS FREEZER (SIGSTOP)'
                        : 'WRITE_FILE LEASE REVOKED • CONTAINER CONFINED TO READ-ONLY MODE'}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-500/40 font-semibold">
                  ENFORCED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Revocation Ledger View */}
        {activeTab === 'ledger' && (
          <div className="mt-2 space-y-2 font-mono text-xs">
            {revokedCaps.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-white/[0.06] text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto opacity-70" />
                <div className="text-slate-300 font-bold">No Individual Capabilities Permanently Revoked</div>
                <div className="text-slate-500 text-[11px]">
                  {securityState === 'RESTRICTED'
                    ? 'Attenuated confinement: System is executing under restrictive policy envelope with compressed lease limits.'
                    : 'System is operating within normal policy invariants.'}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                {revokedCaps.map((cap, idx) => (
                  <div
                    key={cap.capability_id || idx}
                    className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 font-bold text-[10px]">
                          {cap.operation}
                        </span>
                        <span className="text-slate-200 font-semibold">{cap.resource}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reason: <span className="text-rose-300">{cap.revocation_reason || 'Policy Invariant Violation'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40">
                      REVOKED
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Reinstatement Protocol Note */}
            <div className="p-2 rounded-lg bg-slate-950/70 border border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reinstatement Protocol:</span>
              </span>
              <span className="text-emerald-400 font-bold">
                4 Verified Compliant Actions (Probation Recovery)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Invariant Margin */}
      <div className="pt-2.5 mt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="text-slate-500 uppercase font-bold text-[10px]">Security Clearance Margin:</span>
          <span
            className={`font-bold ${
              securityState === 'CRITICAL'
                ? 'text-rose-400'
                : securityState === 'RESTRICTED'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {(massU * 100).toFixed(1)}% / 60.0% Restrict Cap
          </span>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Real-time Kernel Telemetry Synchronized</span>
        </div>
      </div>
    </div>
  );
}
