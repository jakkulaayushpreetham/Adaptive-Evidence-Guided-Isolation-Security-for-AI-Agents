import React from 'react';
import { Activity, AlertCircle, Shield, Layers } from 'lucide-react';

export default function TrustPanel({ trust }) {
  const mass = trust?.mass || { trustworthy: 0.0, untrustworthy: 0.0, uncertainty: 1.0 };
  const mT = mass.trustworthy || 0.0;
  const mU = mass.untrustworthy || 0.0;
  const mTheta = mass.uncertainty ?? 1.0;
  const belT = trust?.belief_trustworthy ?? mT;
  const plT = trust?.plausibility_trustworthy ?? (mT + mTheta);
  const conflictK = trust?.conflict ?? 0.0;

  const getConflictBadge = (k) => {
    if (k < 0.25) return { text: 'LOW CONFLICT', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (k < 0.50) return { text: 'MODERATE CONFLICT', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    if (k < 0.80) return { text: 'HIGH CONFLICT', color: 'text-amber-400 bg-amber-500/10 border-amber-500/40 animate-pulse' };
    return { text: 'CRITICAL CONFLICT', color: 'text-rose-400 bg-rose-500/10 border-rose-500/40 animate-pulse font-bold' };
  };

  const conflictBadge = getConflictBadge(conflictK);

  return (
    <div className="soc-card flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Dempster-Shafer Consensus State
            </h3>
            <div className="text-[11px] text-slate-400">
              Frame of Discernment &Theta; = &#123;T, U&#125;
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] mono border font-semibold ${conflictBadge.color}`}>
            K = {conflictK.toFixed(3)}
          </span>
          <span className="text-[11px] text-slate-400 mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
            {trust?.evidence_count ?? 0} Fused
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* m(T) - Trustworthy */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-emerald-400 mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              m(T) Trustworthy Belief
            </span>
            <span className="text-slate-100 mono font-bold">
              {(mT * 100).toFixed(1)}% <span className="text-slate-500 font-normal">({mT.toFixed(3)})</span>
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, mT * 100))}%` }}
            />
          </div>
        </div>

        {/* m(U) - Distrust */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-rose-400 mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              m(U) Distrust Evidence
            </span>
            <span className="text-slate-100 mono font-bold">
              {(mU * 100).toFixed(1)}% <span className="text-slate-500 font-normal">({mU.toFixed(3)})</span>
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, mU * 100))}%` }}
            />
          </div>
        </div>

        {/* m(Θ) - Epistemic Uncertainty */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-cyan-400 mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              m(&Theta;) Epistemic Uncertainty
            </span>
            <span className="text-slate-100 mono font-bold">
              {(mTheta * 100).toFixed(1)}% <span className="text-slate-500 font-normal">({mTheta.toFixed(3)})</span>
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, mTheta * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Belief Interval: [Bel(T), Pl(T)] */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs mono">
        <div className="text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Belief Range:</span>
          <span className="text-slate-100 font-bold">
            [{belT.toFixed(2)}, {plT.toFixed(2)}]
          </span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Bel(T) = {belT.toFixed(2)} &le; Pl(T) = {plT.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
