import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Key, FileText, PenTool, Globe, Terminal, ShieldAlert } from 'lucide-react';

export default function CapabilityPanel({ capabilities = [], securityState }) {
  const operations = [
    { op: 'READ_FILE', label: 'READ_FILE', desc: '/workspace/input/*', icon: FileText },
    { op: 'WRITE_FILE', label: 'WRITE_FILE', desc: '/workspace/output/*', icon: PenTool },
    { op: 'NETWORK', label: 'NETWORK', desc: 'Out-of-scope egress', icon: Globe },
    { op: 'EXECUTE', label: 'EXECUTE', desc: 'Shell command execution', icon: Terminal },
  ];

  const getStatus = (op) => {
    const found = capabilities.find((c) => c.operation === op);
    if (!found) {
      return { status: 'DENIED_BY_DEFAULT', badge: 'DENIED (NO CAP)', isGranted: false };
    }
    if (found.status === 'REVOKED') {
      return { status: 'REVOKED', badge: 'REVOKED', reason: found.revocation_reason, isGranted: true };
    }
    return { status: 'ACTIVE', badge: 'ACTIVE', isGranted: true };
  };

  const activeCount = capabilities.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="glass-panel p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Task-Scoped Capabilities
            </h3>
            <div className="text-[11px] text-slate-400">
              Cryptographically Isolated Task Permissions
            </div>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-white/[0.08] text-slate-300">
          <span className="text-emerald-400 font-bold">{activeCount}</span> / {capabilities.length} Active
        </span>
      </div>

      {/* Grid of Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {operations.map(({ op, label, desc, icon: Icon }) => {
          const { status, badge, reason } = getStatus(op);
          const isActive = status === 'ACTIVE';
          const isRevoked = status === 'REVOKED';

          return (
            <div
              key={op}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                  : isRevoked
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse'
                  : 'bg-slate-950/40 border-white/[0.05] opacity-55'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                        : isRevoked
                        ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                        : 'text-slate-500'
                    }`}
                  />
                  <span
                    className={`font-mono font-bold text-xs ${
                      isRevoked ? 'line-through text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md tracking-wider uppercase ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isRevoked
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {badge}
                </span>
              </div>

              <div className="font-mono text-[11px] text-slate-300 bg-slate-900/70 px-2 py-1 rounded-md border border-white/[0.06] truncate">
                {desc}
              </div>

              {reason && (
                <div className="text-[10px] text-amber-300/90 mt-1.5 italic truncate font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{reason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
