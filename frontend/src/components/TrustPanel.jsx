import React from 'react';
import { Activity, AlertCircle, Shield, Layers, Scale, Sparkles, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function TrustPanel({ trust }) {
  const mass = trust?.mass || { trustworthy: 0.0, untrustworthy: 0.0, uncertainty: 1.0 };
  const mT = mass.trustworthy || 0.0;
  const mU = mass.untrustworthy || 0.0;
  const mTheta = mass.uncertainty ?? 1.0;
  const belT = trust?.belief_trustworthy ?? mT;
  const plT = trust?.plausibility_trustworthy ?? (mT + mTheta);
  const conflictK = trust?.conflict ?? 0.0;

  const getConflictBadge = (k) => {
    if (k < 0.25)
      return {
        text: 'LOW CONFLICT',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        desc: 'Sensors agree on agent behavior',
      };
    if (k < 0.50)
      return {
        text: 'MODERATE CONFLICT',
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        desc: 'Minor divergence in observed events',
      };
    if (k < 0.80)
      return {
        text: 'HIGH CONFLICT',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/40 animate-pulse font-bold',
        desc: 'Agent performed both benign and suspicious actions',
      };
    return {
      text: 'CRITICAL DISSONANCE',
      color: 'text-rose-400 bg-rose-500/20 border-rose-500/50 animate-pulse font-extrabold',
      desc: 'Extreme contradiction in evidence',
    };
  };

  const conflictBadge = getConflictBadge(conflictK);

  return (
    <div className="glass-panel p-4 flex flex-col justify-between">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Agent Trust &amp; Threat Analysis
              </h3>
              <div className="text-[11px] text-slate-400">
                Evidence Fusion Engine &bull; Dempster-Shafer Model
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${conflictBadge.color}`}
              title={conflictBadge.desc}
            >
              Conflict K = {conflictK.toFixed(3)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded-lg border border-white/[0.06]">
              {trust?.evidence_count ?? 0} Events Analyzed
            </span>
          </div>
        </div>

        {/* Human-Centric Trust Metrics */}
        <div className="space-y-3">
          {/* Verified Compliance / Trust m(T) */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Verified Trust / Compliance
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  {(mT * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  m(T)={mT.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                style={{ width: `${Math.min(100, Math.max(0, mT * 100))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Accumulates when agent performs compliant operations within its assigned scope.
            </div>
          </div>

          {/* Threat Suspicion / Distrust m(U) */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
              <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                Threat Suspicion / Distrust
              </span>
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-mono font-bold text-xs">
                  {(mU * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  m(U)={mU.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                style={{ width: `${Math.min(100, Math.max(0, mU * 100))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Accumulates on security violations (triggers Revocation at &ge;60%, Lockdown at &ge;85%).
            </div>
          </div>

          {/* Uncertainty / Pending Evidence m(Theta) */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                Pending Data / Uncertainty
              </span>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-mono font-bold text-xs">
                  {(mTheta * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  m(&Theta;)={mTheta.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-600 via-sky-500 to-cyan-300 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${Math.min(100, Math.max(0, mTheta * 100))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Reflects unknown behavior. Diminishes as the agent generates runtime operations.
            </div>
          </div>
        </div>
      </div>

      {/* Clear Policy Thresholds Bar */}
      <div className="mt-3.5 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="text-slate-400">Policy Bounds:</span>
          <span className="text-emerald-400 font-bold">&lt;60% Safe</span> &bull;
          <span className="text-amber-400 font-bold">&ge;60% Restrict</span> &bull;
          <span className="text-rose-400 font-bold">&ge;85% Quarantine</span>
        </div>
        <div className="text-slate-400 font-mono text-[10px]">
          Confidence [{belT.toFixed(2)}, {plT.toFixed(2)}]
        </div>
      </div>
    </div>
  );
}
