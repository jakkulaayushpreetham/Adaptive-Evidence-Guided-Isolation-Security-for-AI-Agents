import React from 'react';
import { Scale, Layers } from 'lucide-react';

export default function TrustPanel({ trust }) {
  const mass = trust?.mass || { trustworthy: 0.0, untrustworthy: 0.0, uncertainty: 1.0 };
  const mT = mass.trustworthy || 0.0;
  const mU = mass.untrustworthy || 0.0;
  const mTheta = mass.uncertainty ?? 1.0;
  const belT = trust?.belief_trustworthy ?? mT;
  const plT = trust?.plausibility_trustworthy ?? (mT + mTheta);
  const conflictK = trust?.conflict ?? 0.0;

  const getConflictBadge = (k) => {
    if (k < 0.25) return { text: 'NOMINAL', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (k < 0.50) return { text: 'MODERATE', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    if (k < 0.80) return { text: 'HIGH CONFLICT', color: 'text-amber-400 bg-amber-500/15 border-amber-500/40 animate-pulse' };
    return { text: 'CRITICAL', color: 'text-rose-400 bg-rose-500/20 border-rose-500/50 animate-pulse font-bold' };
  };

  const conflictBadge = getConflictBadge(conflictK);

  return (
    <div className="glass-panel p-4 flex flex-col justify-between h-[230px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-sm">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Trust Engine Consensus
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">
                Dempster-Shafer Frame &Theta; = &#123;T, U&#125;
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${conflictBadge.color}`}>
              K = {conflictK.toFixed(3)} ({conflictBadge.text})
            </span>
            <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded border border-white/[0.06]">
              {trust?.evidence_count ?? 0} Fused
            </span>
          </div>
        </div>

        {/* Crisp Metrics */}
        <div className="space-y-2.5">
          {/* m(T) */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Trust Belief m(T)
              </span>
              <span className="text-slate-100 font-bold">
                {(mT * 100).toFixed(1)}% <span className="text-slate-500 font-normal">({mT.toFixed(3)})</span>
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, mT * 100))}%` }}
              />
            </div>
          </div>

          {/* m(U) */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                Distrust Mass m(U)
              </span>
              <span className="text-slate-100 font-bold">
                {(mU * 100).toFixed(1)}% <span className="text-slate-500 font-normal">({mU.toFixed(3)})</span>
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, mU * 100))}%` }}
              />
            </div>
          </div>

          {/* m(Theta) */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                Uncertainty m(&Theta;)
              </span>
              <span className="text-slate-100 font-bold">
                {(mTheta * 100).toFixed(1)}% <span className="text-slate-500 font-normal">({mTheta.toFixed(3)})</span>
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, mTheta * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Range */}
      <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
        <div className="text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Belief Interval:</span>
          <span className="text-white font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-white/[0.08]">
            [{belT.toFixed(2)}, {plT.toFixed(2)}]
          </span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Thresholds: 0.60 Restrict • 0.85 Quarantine
        </div>
      </div>
    </div>
  );
}
