import React from 'react';
import {
  ArrowDown,
  HelpCircle,
  ShieldAlert,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sliders,
  GitBranch,
  ArrowRight,
  Activity,
  AlertTriangle,
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

  const massT = trust?.mass?.trustworthy ?? (securityState === 'CRITICAL' ? 0.05 : 0.1);
  const massU = trust?.mass?.untrustworthy ?? (securityState === 'CRITICAL' ? 0.88 : 0.6);
  const massTheta = trust?.mass?.uncertainty ?? (securityState === 'CRITICAL' ? 0.07 : 0.3);
  const conflictK = trust?.conflict ?? 0.0;

  if (!hasRevocation) {
    return (
      <div className="glass-panel flex flex-col justify-between h-[320px] p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Explainable Revocation Rationale
              </h3>
              <div className="text-[11px] text-slate-400">
                Dynamic Causal Invariant Verification
              </div>
            </div>
          </div>
          <span className="badge badge-normal">PRIVILEGES INTACT</span>
        </div>

        {/* Dynamic 3-State Formal Transition Machine Visualization */}
        <div className="my-2 p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              Continuous Policy State Machine
            </span>
            <span className="text-emerald-400 font-mono">STATE: NORMAL</span>
          </div>

          {/* Graphical State Node Flow */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
            {/* NORMAL Node */}
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)] flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mb-1" />
              <span className="font-extrabold text-emerald-300">NORMAL</span>
              <span className="text-[9px] text-slate-400 mt-0.5">m(U) &lt; 0.60</span>
            </div>

            {/* RESTRICTED Node */}
            <div className="p-2 rounded-lg bg-slate-900/50 border border-white/[0.06] opacity-50 flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500/40 mb-1" />
              <span className="font-bold text-amber-300">RESTRICTED</span>
              <span className="text-[9px] text-slate-400 mt-0.5">m(U) &ge; 0.60</span>
            </div>

            {/* CRITICAL Node */}
            <div className="p-2 rounded-lg bg-slate-900/50 border border-white/[0.06] opacity-50 flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-rose-500/40 mb-1" />
              <span className="font-bold text-rose-300">CRITICAL</span>
              <span className="text-[9px] text-slate-400 mt-0.5">m(U) &ge; 0.85</span>
            </div>
          </div>
        </div>

        {/* Real-time Safety Clearance Margin Bars */}
        <div className="space-y-2 text-xs font-mono">
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
              <span>Distrust Margin Clearance:</span>
              <span className="text-emerald-400 font-bold">
                m(U) = {massU.toFixed(2)} / 0.60 Cap
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (massU / 0.6) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
              <span>D-S Epistemic Conflict Margin:</span>
              <span className="text-sky-400 font-bold">
                K = {conflictK.toFixed(3)} / 0.50 Cap
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (conflictK / 0.5) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Safety Bounds Summary */}
        <div className="pt-2 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1 rounded-lg bg-slate-900/60 border border-white/[0.06]">
            <span className="text-[9px] text-slate-400 block font-sans">Restricted Cap</span>
            <span className="font-mono font-bold text-amber-400">m(U) &ge; 0.60</span>
          </div>
          <div className="p-1 rounded-lg bg-slate-900/60 border border-white/[0.06]">
            <span className="text-[9px] text-slate-400 block font-sans">Critical Cap</span>
            <span className="font-mono font-bold text-rose-400">m(U) &ge; 0.85</span>
          </div>
          <div className="p-1 rounded-lg bg-slate-900/60 border border-white/[0.06]">
            <span className="text-[9px] text-slate-400 block font-sans">Conflict Cap</span>
            <span className="font-mono font-bold text-sky-400">K &ge; 0.50</span>
          </div>
        </div>
      </div>
    );
  }

  // Derive explainable stages from real state
  const eventDesc = lastViolationEvent
    ? `${lastViolationEvent.operation} ${lastViolationEvent.resource}`
    : securityState === 'CRITICAL'
    ? 'UNAUTHORIZED_EXECUTE /bin/malicious_payload.sh'
    : 'UNAUTHORIZED_NETWORK https://exfiltrate.example.org';

  const eventReason = lastViolationEvent?.reason || 'DENIED — NO_CAPABILITY';

  const policyTransition =
    securityState === 'CRITICAL'
      ? 'RESTRICTED → CRITICAL (m(U) ≥ 0.85 Threshold Breached)'
      : 'NORMAL → RESTRICTED (D-S Conflict K ≥ 0.50 or m(U) ≥ 0.60)';

  const actionDesc =
    securityState === 'CRITICAL'
      ? 'TOTAL REVOCATION: All capabilities invalidated & isolation requested'
      : 'PARTIAL REVOCATION: WRITE_FILE revoked (Quarantined to read-only)';

  return (
    <div className="glass-panel flex flex-col h-[320px] overflow-y-auto p-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Why Was Authority Revoked?
            </h3>
            <div className="text-[11px] text-slate-400">
              Causal Evidence Chain &amp; Policy Rationale
            </div>
          </div>
        </div>
        <span className="badge badge-restricted">CAUSAL CHAIN</span>
      </div>

      <div className="space-y-1.5 mt-2 text-xs">
        {/* Step 1: Observed Event */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              1. Observed Violation Event
            </div>
            <div className="font-mono font-bold text-rose-400 text-xs">{eventDesc}</div>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/35 font-bold">
            {eventReason}
          </span>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 2: Evidence Assignment */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
            2. Dempster-Shafer Mass Assignment
          </div>
          <div className="font-mono text-[11px] text-slate-300 flex items-center gap-3">
            <span>m(T) = {massT.toFixed(2)}</span>
            <span className="text-rose-400 font-bold">m(U) = {massU.toFixed(2)}</span>
            <span>m(&Theta;) = {massTheta.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 3: Policy Decision */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
            3. Adaptive Policy Engine Decision
          </div>
          <div className="font-mono font-bold text-amber-300 text-xs">{policyTransition}</div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 4: Enforcement Action */}
        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-0.5">
            4. Deterministic Enforcement Action
          </div>
          <div className="font-mono font-bold text-rose-200 text-xs">{actionDesc}</div>
        </div>
      </div>
    </div>
  );
}
