import React from 'react';
import { UserCheck, Shield, Box, Fingerprint, Layers } from 'lucide-react';

export default function AgentPassport({ agentId, taskId, trust, activeCapsCount = 0 }) {
  const belT = trust?.belief_trustworthy ?? 0.0;
  const plT = trust?.plausibility_trustworthy ?? 1.0;

  return (
    <div className="glass-panel p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Fingerprint className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Agent Security Passport
            </span>
          </div>
          <span className="badge-pill badge-pill-purple">
            PROVISIONED
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Agent Principal:
            </span>
            <span className="mono font-bold text-white text-xs">{agentId || 'AGENT-001'}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              Sandbox Boundary:
            </span>
            <span className="mono text-slate-300 text-[11px] font-semibold">Docker / Namespaced</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Authorized Caps:
            </span>
            <span className="mono font-bold text-emerald-400">{activeCapsCount} Active</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          Belief Interval:
        </span>
        <span className="mono text-slate-200 font-semibold text-[11px]">
          [{belT.toFixed(2)}, {plT.toFixed(2)}]
        </span>
      </div>
    </div>
  );
}
