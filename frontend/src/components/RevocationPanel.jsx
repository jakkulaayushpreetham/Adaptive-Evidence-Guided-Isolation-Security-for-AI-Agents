import React from 'react';
import { ArrowDown, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      <div className="soc-card flex flex-col justify-between h-[340px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Explainable Revocation Rationale
            </span>
          </div>
          <span className="badge badge-normal">PRIVILEGES INTACT</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mb-2" />
          <div className="text-sm font-semibold text-slate-200">No Privilege Revocations Active</div>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Agent actions remain compliant with task-scoped bounds. Authority is justified continuously by Dempster-Shafer consensus.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 mono">
          Status: Autonomous agent executing within validated boundaries.
        </div>
      </div>
    );
  }

  // Derive explainable stages from real state
  const eventDesc = lastViolationEvent
    ? `${lastViolationEvent.operation} ${lastViolationEvent.resource}`
    : securityState === 'CRITICAL'
    ? 'PRIVATE_DATA_ACCESS /workspace/private/credentials.env'
    : 'NETWORK_EGRESS /network/external/exfil';

  const eventReason = lastViolationEvent?.reason || 'DENIED — NO_CAPABILITY';

  const massT = trust?.mass?.trustworthy ?? (securityState === 'CRITICAL' ? 0.05 : 0.10);
  const massU = trust?.mass?.untrustworthy ?? (securityState === 'CRITICAL' ? 0.85 : 0.60);
  const massTheta = trust?.mass?.uncertainty ?? (securityState === 'CRITICAL' ? 0.10 : 0.30);

  const policyTransition =
    securityState === 'CRITICAL'
      ? 'RESTRICTED → CRITICAL (Distrust m(U) > 0.80)'
      : 'NORMAL → RESTRICTED (Distrust m(U) ≥ 0.60)';

  const actionDesc =
    securityState === 'CRITICAL'
      ? 'ALL CAPABILITIES REVOKED & PHYSICAL ISOLATION DISPATCHED'
      : 'WRITE_FILE REVOKED (Read-Only Quarantine)';

  return (
    <div className="soc-card flex flex-col h-[340px] overflow-y-auto">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Why Was Authority Revoked?
          </span>
        </div>
        <span className="badge badge-restricted">CAUSAL AUDIT</span>
      </div>

      <div className="space-y-2 mt-2 text-xs">
        {/* Step 1: Observed Event */}
        <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
            1. Observed Violation Event
          </div>
          <div className="mono font-semibold text-rose-400">{eventDesc}</div>
          <div className="text-[11px] text-slate-400">{eventReason}</div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3.5 h-3.5" />
        </div>

        {/* Step 2: Evidence Assignment */}
        <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
            2. Evidence Mapping (Bayesian/Frequency Free)
          </div>
          <div className="mono text-[11px] text-slate-300">
            m(T) = {massT.toFixed(2)} | <span className="text-rose-400 font-bold">m(U) = {massU.toFixed(2)}</span> | m(Θ) = {massTheta.toFixed(2)}
          </div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3.5 h-3.5" />
        </div>

        {/* Step 3: Policy Decision */}
        <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
            3. Adaptive Policy Decision
          </div>
          <div className="mono font-semibold text-amber-400">{policyTransition}</div>
        </div>

        <div className="flex justify-center -my-1 text-slate-600">
          <ArrowDown className="w-3.5 h-3.5" />
        </div>

        {/* Step 4: Enforcement Action */}
        <div className="p-2 rounded bg-rose-950/30 border border-rose-500/40">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-0.5">
            4. Deterministic Enforcement Action
          </div>
          <div className="mono font-bold text-rose-200">{actionDesc}</div>
        </div>
      </div>
    </div>
  );
}
