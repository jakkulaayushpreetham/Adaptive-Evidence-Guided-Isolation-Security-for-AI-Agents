import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Key } from 'lucide-react';

export default function CapabilityPanel({ capabilities = [], securityState }) {
  const operations = [
    { op: 'READ_FILE', label: 'READ_FILE', desc: '/workspace/input/*' },
    { op: 'WRITE_FILE', label: 'WRITE_FILE', desc: '/workspace/output/*' },
    { op: 'NETWORK', label: 'NETWORK', desc: 'Out-of-scope egress' },
    { op: 'EXECUTE', label: 'EXECUTE', desc: 'Shell command execution' },
  ];

  const getStatus = (op) => {
    const found = capabilities.find((c) => c.operation === op);
    if (!found) {
      return { status: 'DENIED_BY_DEFAULT', badge: '✕ DENIED' };
    }
    if (found.status === 'REVOKED') {
      return { status: 'REVOKED', badge: '⚠ REVOKED', reason: found.revocation_reason };
    }
    return { status: 'ACTIVE', badge: '✓ ACTIVE' };
  };

  return (
    <div className="soc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Task-Scoped Capabilities
          </span>
        </div>
        <span className="text-xs text-slate-500 mono">
          Active: {capabilities.filter((c) => c.status === 'ACTIVE').length} / {capabilities.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {operations.map(({ op, label, desc }) => {
          const { status, badge, reason } = getStatus(op);
          const isActive = status === 'ACTIVE';
          const isRevoked = status === 'REVOKED';

          return (
            <div
              key={op}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isActive
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : isRevoked
                  ? 'bg-amber-950/25 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="mono font-semibold text-sm">{label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isRevoked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                  }`}
                >
                  {badge}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate mono">{desc}</div>
              {reason && (
                <div className="text-[10px] text-amber-400/80 mt-1 italic truncate">
                  Reason: {reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
