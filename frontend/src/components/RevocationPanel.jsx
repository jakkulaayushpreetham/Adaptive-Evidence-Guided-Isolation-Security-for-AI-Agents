import React from 'react';
import {
  ArrowDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  Lock,
} from 'lucide-react';

export default function RevocationPanel({
  lastViolationEvent,
  securityState,
  trust,
  revokedCaps = [],
}) {
  const hasRevocation =
    securityState === 'RESTRICTED' ||
    securityState === 'CRITICAL' ||
    revokedCaps.length > 0;

  const massU = trust?.mass?.untrustworthy ?? (securityState === 'CRITICAL' ? 0.88 : 0.6);
  const conflictK = trust?.conflict ?? 0.0;

  if (!hasRevocation) {
    return (
      <div className="glass-panel flex flex-col justify-between h-[300px] p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Policy Enforcement Engine
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">
                Continuous Invariant Verification
              </div>
            </div>
          </div>
          <span className="badge badge-normal">INVARIANTS VALIDATED</span>
        </div>

        {/* State Machine Nodes */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              Policy State Transition Graph
            </span>
            <span className="text-emerald-400 font-bold">ACTIVE: NORMAL</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mb-1" />
              <span className="font-extrabold text-emerald-300">NORMAL</span>
              <span className="text-[9px] text-slate-400 mt-0.5">m(U) &lt; 0.60</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/40 border border-white/[0.05] opacity-50 flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500/40 mb-1" />
              <span className="font-bold text-amber-300">RESTRICTED</span>
              <span className="text-[9px] text-slate-400 mt-0.5">m(U) &ge; 0.60</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/40 border border-white/[0.05] opacity-50 flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-rose-500/40 mb-1" />
              <span className="font-bold text-rose-300">CRITICAL</span>
              <span className="text-[9px] text-slate-400 mt-0.5">m(U) &ge; 0.85</span>
            </div>
          </div>
        </div>

        {/* Real-time Clearance Margin */}
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Distrust Margin to Restriction:</span>
            <span className="text-emerald-400 font-bold">
              {(massU * 100).toFixed(1)}% / 60.0% Cap
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (massU / 0.6) * 100)}%` }}
            />
          </div>
        </div>

        {/* Formal Invariant Badges */}
        <div className="pt-2 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-1 rounded bg-slate-900/60 border border-white/[0.06]">
            <span className="text-[9px] text-slate-500 block">Restricted Cap</span>
            <span className="font-bold text-amber-400">m(U) &ge; 0.60</span>
          </div>
          <div className="p-1 rounded bg-slate-900/60 border border-white/[0.06]">
            <span className="text-[9px] text-slate-500 block">Critical Cap</span>
            <span className="font-bold text-rose-400">m(U) &ge; 0.85</span>
          </div>
          <div className="p-1 rounded bg-slate-900/60 border border-white/[0.06]">
            <span className="text-[9px] text-slate-500 block">Conflict Cap</span>
            <span className="font-bold text-sky-400">K &ge; 0.50</span>
          </div>
        </div>
      </div>
    );
  }

  const eventDesc = lastViolationEvent
    ? `${lastViolationEvent.operation} ${lastViolationEvent.resource}`
    : securityState === 'CRITICAL'
    ? 'WRITE_FILE /workspace/output/summary.txt'
    : 'READ_FILE /workspace/private/credentials.env';

  const eventReason = lastViolationEvent?.reason || (securityState === 'CRITICAL' ? 'CAPABILITY_REVOKED' : 'RESOURCE_MISMATCH');

  return (
    <div className="glass-panel flex flex-col h-[300px] overflow-y-auto p-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Revocation Causal Evidence Chain
            </h3>
            <div className="text-[11px] text-slate-400 font-mono">
              Deterministic Policy Enforcement
            </div>
          </div>
        </div>
        <span className="badge badge-restricted">REVOCATION ACTIVE</span>
      </div>

      <div className="space-y-2 mt-2.5 text-xs font-mono">
        {/* Step 1 */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">1. Intercepted Event</span>
            <span className="font-bold text-rose-400 text-xs">{eventDesc}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
            {eventReason}
          </span>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 2 */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-white/[0.08]">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">2. Mass Evidence Formulation</span>
          <span className="text-slate-300 text-[11px]">
            m(U) = <strong className="text-rose-400 font-bold">{(massU * 100).toFixed(1)}%</strong> | K = <strong className="text-amber-300">{conflictK.toFixed(3)}</strong>
          </span>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 3 */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-white/[0.08]">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">3. Policy State Transition</span>
          <span className="font-bold text-amber-300 text-xs">
            {securityState === 'CRITICAL' ? 'STATE -> CRITICAL (m(U) >= 0.85)' : 'STATE -> RESTRICTED (m(U) >= 0.60)'}
          </span>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 4 */}
        <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/40">
          <span className="text-[10px] text-rose-400 uppercase font-bold block">4. Enforcement Actuation</span>
          <span className="font-bold text-rose-200 text-xs">
            {securityState === 'CRITICAL' ? 'ALL CAPABILITIES REVOKED & ISOLATION REQUESTED' : 'WRITE_FILE CAPABILITY REVOKED (READ-ONLY CONFINED)'}
          </span>
        </div>
      </div>
    </div>
  );
}
