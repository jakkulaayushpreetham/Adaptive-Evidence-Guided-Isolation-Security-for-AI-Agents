import React from 'react';
import { History, ShieldAlert, KeyRound, AlertOctagon, Terminal, CheckCircle2 } from 'lucide-react';

export default function IncidentTimeline({ timeline = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'POLICY_TRANSITION':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'CAPABILITY_REVOKED':
        return <KeyRound className="w-3.5 h-3.5 text-rose-400" />;
      case 'AGENT_ISOLATED':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />;
      case 'SECURITY_EVENT':
      default:
        return <Terminal className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'POLICY_TRANSITION':
        return 'badge-restricted';
      case 'CAPABILITY_REVOKED':
      case 'AGENT_ISOLATED':
        return 'badge-critical';
      default:
        return 'badge-muted';
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return d.toTimeString().split(' ')[0];
    } catch {
      return ts;
    }
  };

  return (
    <div className="soc-card flex flex-col h-[280px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Incident Timeline &amp; Provenance Audit
            </h3>
            <div className="text-[11px] text-slate-400">
              Cryptographic Audit Log of State Changes
            </div>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
          {timeline.length} Entries
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-2.5 pr-1 space-y-2 text-xs">
        {timeline.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mb-1.5" />
            <div className="text-xs font-semibold text-slate-400">
              Audit Provenance Ledger Clean
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
              No security violations, policy transitions, or capability revocations recorded for this task session.
            </p>
          </div>
        ) : (
          timeline.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850 transition-colors"
            >
              <div className="mt-0.5 p-1 rounded bg-slate-800/80 border border-slate-700/60 shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`badge text-[9px] ${getBadgeClass(item.type)}`}>
                    {item.type}
                  </span>
                  <span className="mono text-[10px] text-slate-500 font-medium">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <div className="text-slate-300 mono text-[11px] break-words leading-relaxed">
                  {item.details}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
