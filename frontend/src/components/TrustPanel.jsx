import React, { useState } from 'react';
import { Scale, Layers, Info, Activity, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function TrustPanel({ trust }) {
  const [showFormula, setShowFormula] = useState(false);

  const mass = trust?.mass || { trustworthy: 0.0, untrustworthy: 0.0, uncertainty: 1.0 };
  const mT = mass.trustworthy || 0.0;
  const mU = mass.untrustworthy || 0.0;
  const mTheta = mass.uncertainty ?? 1.0;
  const belT = trust?.belief_trustworthy ?? mT;
  const plT = trust?.plausibility_trustworthy ?? (mT + mTheta);
  const conflictK = trust?.conflict ?? 0.0;
  const evidenceCount = trust?.evidence_count ?? 0;

  // Dempster's Normalization Factor: alpha = 1 / (1 - K)
  const normalizerAlpha = conflictK < 0.999 ? (1 / (1 - conflictK)).toFixed(2) : 'INF';

  const getConflictBadge = (k) => {
    if (k < 0.20) {
      return {
        text: 'NOMINAL',
        desc: 'Negligible Sensor Divergence',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
        dot: 'bg-emerald-400',
      };
    }
    if (k < 0.50) {
      return {
        text: 'MODERATE',
        desc: 'Sub-threshold Disagreement',
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]',
        dot: 'bg-sky-400',
      };
    }
    if (k < 0.80) {
      return {
        text: 'HIGH CONFLICT',
        desc: 'Triggers Invariant Restriction (K ≥ 0.50)',
        color: 'text-amber-300 bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse',
        dot: 'bg-amber-400',
      };
    }
    return {
      text: 'CRITICAL CONFLICT',
      desc: 'Severe Sensor Incoherence (K ≥ 0.80)',
      color: 'text-rose-300 bg-rose-500/25 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-pulse font-extrabold',
      dot: 'bg-rose-400',
    };
  };

  const conflictBadge = getConflictBadge(conflictK);

  return (
    <div className="glass-panel p-4 flex flex-col justify-between min-h-[290px] border border-white/[0.12] bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-[#070b14]/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden group">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3.5 border-b border-white/[0.08] gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                  Trust Engine Consensus
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 font-mono font-semibold">
                  D-S FUSION
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1 mt-0.5">
                <span>Dempster-Shafer Frame &Theta; = &#123;T, U&#125;</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Conflict Metric Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${conflictBadge.color}`}
              title={conflictBadge.desc}
            >
              <span className={`w-2 h-2 rounded-full ${conflictBadge.dot}`} />
              <span className="font-bold">K = {conflictK.toFixed(3)}</span>
              <span className="text-[10px] opacity-85 hidden sm:inline">({conflictBadge.text})</span>
            </div>

            {/* Evidence Count Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-300 font-mono text-xs border border-white/[0.08] shadow-sm">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-white">{evidenceCount}</span>
              <span className="text-[10px] text-slate-400">Observations</span>
            </div>

            {/* Toggle Math Formula */}
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="p-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-white/[0.06] transition-colors cursor-pointer"
              title="Toggle mathematical formulation details"
            >
              {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Formula Drawer */}
        {showFormula && (
          <div className="mb-3.5 p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 text-xs font-mono space-y-1.5 text-slate-300 animate-fadeIn">
            <div className="text-purple-300 font-bold flex items-center justify-between text-[11px]">
              <span>Dempster's Rule of Combination:</span>
              <span className="text-cyan-300 font-mono">Normalizer &alpha; = 1/(1-K) = {normalizerAlpha}</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Orthogonal sum: <code className="text-emerald-400">m(A) = &alpha; &times; &sum; m₁(B)m₂(C) [B&cap;C=A]</code>. 
              Mass is non-probabilistic: remaining mass resides in epistemic state <code className="text-cyan-400">m(&Theta;)</code> (Uncertainty).
            </div>
          </div>
        )}

        {/* Dynamic Mass Gauges */}
        <div className="space-y-3">
          {/* m(T) - Trust Belief */}
          <div className="group/item">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                Trust Belief m(T)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-xs">
                  {(mT * 100).toFixed(1)}%
                </span>
                <span className="text-slate-500 text-[10px] font-mono">
                  [{mT.toFixed(3)}]
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/[0.06] p-[1px] relative shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                style={{ width: `${Math.min(100, Math.max(0, mT * 100))}%` }}
              />
            </div>
          </div>

          {/* m(U) - Distrust Mass */}
          <div className="group/item">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
                Distrust Mass m(U)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-xs">
                  {(mU * 100).toFixed(1)}%
                </span>
                <span className="text-slate-500 text-[10px] font-mono">
                  [{mU.toFixed(3)}]
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/[0.06] p-[1px] relative shadow-inner">
              <div
                className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]"
                style={{ width: `${Math.min(100, Math.max(0, mU * 100))}%` }}
              />
            </div>
          </div>

          {/* m(Theta) - Epistemic Uncertainty */}
          <div className="group/item">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
                Epistemic Uncertainty m(&Theta;)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-xs">
                  {(mTheta * 100).toFixed(1)}%
                </span>
                <span className="text-slate-500 text-[10px] font-mono">
                  [{mTheta.toFixed(3)}]
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/[0.06] p-[1px] relative shadow-inner">
              <div
                className="bg-gradient-to-r from-cyan-600 via-sky-400 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                style={{ width: `${Math.min(100, Math.max(0, mTheta * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Belief-Plausibility Interval Visual Ribbon */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Belief-Plausibility Interval [Bel(T), Pl(T)]:</span>
            </span>
            <span className="font-extrabold text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
              [{belT.toFixed(3)}, {plT.toFixed(3)}]
            </span>
          </div>

          {/* Graphical Dual-Bound Interval Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full relative overflow-hidden border border-white/[0.08]">
            {/* Plausibility range (light shaded band) */}
            <div
              className="absolute top-0 bottom-0 bg-purple-500/25 border-r border-purple-400 transition-all duration-500"
              style={{
                left: `${Math.min(100, Math.max(0, belT * 100))}%`,
                width: `${Math.min(100, Math.max(0, (plT - belT) * 100))}%`,
              }}
              title={`Epistemic Uncertainty Zone: ${(mTheta * 100).toFixed(1)}%`}
            />
            {/* Belief range (solid verified mass) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, belT * 100))}%` }}
              title={`Hard Believed Mass: ${(belT * 100).toFixed(1)}%`}
            />
          </div>
        </div>
      </div>

      {/* Invariant Thresholds Legend */}
      <div className="pt-2.5 mt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="text-slate-500 uppercase font-bold">Policy Bounds:</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
            Restrict: m(U)&ge;0.60 | K&ge;0.50
          </span>
          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
            Critical: m(U)&ge;0.85 | K&ge;0.80
          </span>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Non-monotonic Invariants Enforced</span>
        </div>
      </div>
    </div>
  );
}
