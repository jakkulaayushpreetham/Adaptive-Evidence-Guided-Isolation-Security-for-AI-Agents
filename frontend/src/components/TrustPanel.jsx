import React from 'react';
import { Activity } from 'lucide-react';

export default function TrustPanel({ trust }) {
  const mass = trust?.mass || { trustworthy: 0.0, untrustworthy: 0.0, uncertainty: 1.0 };
  const mT = mass.trustworthy || 0.0;
  const mU = mass.untrustworthy || 0.0;
  const mTheta = mass.uncertainty || 0.0;
  const belT = trust?.belief_trustworthy ?? mT;
  const plT = trust?.plausibility_trustworthy ?? (mT + mTheta);

  return (
    <div className="soc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dempster-Shafer Evidence State (Θ = &#123;T, U&#125;)
          </span>
        </div>
        <span className="text-xs text-slate-500 mono">
          Events Fused: {trust?.evidence_count ?? 0}
        </span>
      </div>

      <div className="space-y-3.5">
        {/* m(T) - Trustworthy */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-emerald-400 mono">m(T) Trustworthy Support</span>
            <span className="text-slate-200 mono font-bold">{(mT * 100).toFixed(1)}% ({mT.toFixed(3)})</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, mT * 100)}%` }}
            />
          </div>
        </div>

        {/* m(U) - Untrustworthy */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-rose-400 mono">m(U) Distrust Evidence</span>
            <span className="text-slate-200 mono font-bold">{(mU * 100).toFixed(1)}% ({mU.toFixed(3)})</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              style={{ width: `${Math.min(100, mU * 100)}%` }}
            />
          </div>
        </div>

        {/* m(Θ) - Unresolved Uncertainty */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-sky-400 mono">m(Θ) Epistemic Uncertainty</span>
            <span className="text-slate-200 mono font-bold">{(mTheta * 100).toFixed(1)}% ({mTheta.toFixed(3)})</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
              style={{ width: `${Math.min(100, mTheta * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Belief Interval: [Bel(T), Pl(T)] */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs mono">
        <div className="text-slate-400">
          Belief Interval: <span className="text-slate-200 font-semibold">[{belT.toFixed(2)}, {plT.toFixed(2)}]</span>
        </div>
        <div className="text-slate-500">
          Bel(T) = {belT.toFixed(2)} | Pl(T) = {plT.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
