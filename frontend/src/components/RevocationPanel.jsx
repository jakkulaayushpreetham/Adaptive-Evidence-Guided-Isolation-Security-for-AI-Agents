import React from 'react';
import { ArrowDown, HelpCircle, ShieldAlert, CheckCircle2, ShieldCheck, Lock, Sliders } from 'lucide-react';

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

  if (!hasRevocation) {
    return (
      <div className="soc-card flex flex-col justify-between h-[320px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Explainable Revocation Rationale
              </h3>
              <div className="text-[11px] text-slate-400">
                Mathematical Justification for Authority Changes
              </div>
            </div>
          </div>
          <span className="badge badge-normal">PRIVILEGES INTACT</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-slate-100">
            Task Authority Intact &amp; Validated
          </div>
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
            All agent operations conform to task-scoped boundaries. No violations have triggered the Dempster-Shafer consensus thresholds.
          </p>
        </div>

        {/* Safety Boundary Bounds Summary */}
        <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Restricted Cap</span>
            <span className="mono font-bold text-amber-400">m(U) &ge; 0.60</span>
          </div>
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Critical Cap</span>
            <span className="mono font-bold text-rose-400">m(U) &ge; 0.85</span>
          </div>
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Conflict Cap</span>
            <span className="mono font-bold text-sky-400">K &ge; 0.50</span>
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

  const massT = trust?.mass?.trustworthy ?? (securityState === 'CRITICAL' ? 0.05 : 0.10);
  const massU = trust?.mass?.untrustworthy ?? (securityState === 'CRITICAL' ? 0.88 : 0.60);
  const massTheta = trust?.mass?.uncertainty ?? (securityState === 'CRITICAL' ? 0.07 : 0.30);

  const policyTransition =
    securityState === 'CRITICAL'
      ? 'RESTRICTED → CRITICAL (m(U) ≥ 0.85 Threshold Breached)'
      : 'NORMAL → RESTRICTED (D-S Conflict K ≥ 0.50 or m(U) ≥ 0.60)';

  const actionDesc =
    securityState === 'CRITICAL'
      ? 'TOTAL REVOCATION: All capabilities invalidated & isolation requested'
      : 'PARTIAL REVOCATION: WRITE_FILE revoked (Quarantined to read-only)';

  return (
    <div className="soc-card flex flex-col h-[320px] overflow-y-auto">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
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
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              1. Observed Violation Event
            </div>
            <div className="mono font-bold text-rose-400 text-xs">{eventDesc}</div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {eventReason}
          </span>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 2: Evidence Assignment */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
            2. Dempster-Shafer Mass Assignment
          </div>
          <div className="mono text-[11px] text-slate-300 flex items-center gap-3">
            <span>m(T) = {massT.toFixed(2)}</span>
            <span className="text-rose-400 font-bold">m(U) = {massU.toFixed(2)}</span>
            <span>m(Θ) = {massTheta.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 3: Policy Decision */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
            3. Adaptive Policy Engine Decision
          </div>
          <div className="mono font-bold text-amber-300 text-xs">{policyTransition}</div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3 h-3" />
        </div>

        {/* Step 4: Enforcement Action */}
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-0.5">
            4. Deterministic Enforcement Action
          </div>
          <div className="mono font-bold text-rose-200 text-xs">{actionDesc}</div>
        </div>
      </div>
    </div>
  );
}
