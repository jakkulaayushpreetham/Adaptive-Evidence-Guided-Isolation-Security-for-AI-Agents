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
  Info,
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
                Policy Decision &amp; Enforcement Rationale
              </h3>
              <div className="text-[11px] text-slate-400">
                Dynamic Privilege Revocation Controller
              </div>
            </div>
          </div>
          <span className="badge badge-normal">PRIVILEGES INTACT</span>
        </div>

        {/* Clear Human Status Box */}
        <div className="my-2 p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/25 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Agent Operating Safely Within Bounds</div>
              <div className="text-xs text-slate-400 mt-0.5">
                No policy violations detected. Full task-scoped authority granted.
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-cyan-300 block mb-0.5">How Dynamic Revocation Works:</span>
            When the agent attempts an out-of-scope action (like reading credentials or probing the network), the Kernel Reference Monitor intercepts it and updates threat suspicion. If suspicion reaches <strong className="text-amber-400">60%</strong>, the <code className="text-amber-300 font-bold">WRITE_FILE</code> capability is revoked in real-time.
          </div>
        </div>

        {/* Real-time Safety Clearance Meter */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-400">Threat Suspicion Margin:</span>
            <span className="text-emerald-400 font-bold">
              {(massU * 100).toFixed(1)}% / 60.0% Revocation Threshold
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (massU / 0.6) * 100)}%` }}
            />
          </div>
        </div>

        {/* Threshold Bounds Chips */}
        <div className="pt-2 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-slate-900/70 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">Normal Zone</span>
            <span className="font-mono font-bold text-emerald-400">&lt; 60% Distrust</span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900/70 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">Revoke Write</span>
            <span className="font-mono font-bold text-amber-400">&ge; 60% Distrust</span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900/70 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">Quarantine</span>
            <span className="font-mono font-bold text-rose-400">&ge; 85% Distrust</span>
          </div>
        </div>
      </div>
    );
  }

  // Derive explainable stages from real state
  const eventDesc = lastViolationEvent
    ? `${lastViolationEvent.operation} ${lastViolationEvent.resource}`
    : securityState === 'CRITICAL'
    ? 'WRITE_FILE /workspace/output/summary.txt'
    : 'READ_FILE /workspace/private/credentials.env';

  const eventReason = lastViolationEvent?.reason || (securityState === 'CRITICAL' ? 'CAPABILITY_REVOKED' : 'RESOURCE_MISMATCH');

  const policyTransition =
    securityState === 'CRITICAL'
      ? 'RESTRICTED → CRITICAL (Threat Suspicion breached 85% safety threshold)'
      : 'NORMAL → RESTRICTED (Evidence Conflict K ≥ 0.50 or Threat Suspicion ≥ 60%)';

  const actionDesc =
    securityState === 'CRITICAL'
      ? 'TOTAL LOCKDOWN: All authority revoked & container namespace quarantine triggered'
      : 'PARTIAL REVOCATION: WRITE_FILE revoked (Agent quarantined to read-only)';

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
              Plain-English Causal Chain &amp; Policy Rationale
            </div>
          </div>
        </div>
        <span className="badge badge-restricted">CAUSAL CHAIN</span>
      </div>

      <div className="space-y-2 mt-2 text-xs">
        {/* Step 1: Observed Event */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              1. Observed Violation Event
            </div>
            <div className="font-mono font-bold text-rose-400 text-xs mt-0.5">{eventDesc}</div>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/35 font-bold">
            {eventReason}
          </span>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 2: Evidence Assignment */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
            2. Trust Engine Impact
          </div>
          <div className="text-[11px] text-slate-200">
            Threat suspicion increased to <strong className="text-rose-400 font-mono font-bold">{(massU * 100).toFixed(1)}%</strong> with evidence contradiction <strong className="text-amber-300 font-mono">K={conflictK.toFixed(3)}</strong>.
          </div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 3: Policy Decision */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
            3. Adaptive Policy Engine Decision
          </div>
          <div className="font-mono font-bold text-amber-300 text-xs">{policyTransition}</div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 4: Enforcement Action */}
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-0.5">
            4. Deterministic Enforcement Action
          </div>
          <div className="font-mono font-bold text-rose-200 text-xs">{actionDesc}</div>
        </div>
      </div>
    </div>
  );
}
