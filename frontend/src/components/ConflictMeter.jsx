import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ConflictMeter({ conflict = 0.0 }) {
  const kVal = typeof conflict === 'number' ? conflict : 0.0;

  const getConflictLevel = (k) => {
    if (k < 0.25) return { level: 'LOW', color: 'text-emerald-400', bar: 'bg-emerald-500' };
    if (k < 0.50) return { level: 'MODERATE', color: 'text-sky-400', bar: 'bg-sky-500' };
    if (k < 0.80) return { level: 'HIGH', color: 'text-amber-400', bar: 'bg-amber-500' };
    return { level: 'CRITICAL', color: 'text-rose-400', bar: 'bg-rose-500' };
  };

  const { level, color, bar } = getConflictLevel(kVal);

  return (
    <div className="soc-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Evidence Conflict (K)
            </span>
          </div>
          <span className={`text-xs font-bold mono ${color}`}>{level}</span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold mono text-slate-100">{kVal.toFixed(3)}</span>
            <span className="text-xs text-slate-400 mono">K ∈ [0.0, 1.0]</span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`${bar} h-full rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, kVal * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 leading-tight">
        {kVal >= 0.50 ? (
          <span className="text-amber-400 font-medium">
            ⚠ High conflict detected: Conservative restriction enforced.
          </span>
        ) : (
          <span>Evidence sources agree; normalization factor (1-K) is stable.</span>
        )}
      </div>
    </div>
  );
}
