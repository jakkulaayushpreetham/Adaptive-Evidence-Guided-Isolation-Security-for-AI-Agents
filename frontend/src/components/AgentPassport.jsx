import React from 'react';
import { UserCheck, Shield, Box, Fingerprint } from 'lucide-react';

export default function AgentPassport({ agentId, taskId, trust, activeCapsCount = 0 }) {
  const belT = trust?.belief_trustworthy ?? 0.0;
  const plT = trust?.plausibility_trustworthy ?? 1.0;

  return (
    <div className="soc-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Agent Security Passport
            </span>
          </div>
          <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30">
            PROVISIONED
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              Agent Principal:
            </span>
            <span className="mono font-semibold text-slate-100">{agentId || 'AGENT-001'}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              Sandbox Boundary:
            </span>
            <span className="mono text-slate-300">Docker / Namespaced</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Authorized Caps:
            </span>
            <span className="mono font-bold text-emerald-400">{activeCapsCount} Active</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500">Belief Range:</span>
        <span className="mono text-slate-300 font-medium">
          Bel(T) <span className="text-emerald-400 font-bold">{belT.toFixed(2)}</span> &le; Pl(T) <span className="text-sky-400 font-bold">{plT.toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}
