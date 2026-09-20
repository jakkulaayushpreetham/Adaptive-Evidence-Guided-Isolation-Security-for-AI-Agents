import React from 'react';
import { History, ShieldAlert, KeyRound, AlertOctagon, Terminal } from 'lucide-react';

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
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Incident Timeline & Provenance Audit
          </span>
        </div>
        <span className="text-[11px] text-slate-500 mono">
          {timeline.length} Audit Entries
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 text-xs">
        {timeline.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No incidents or state changes recorded yet.
          </div>
        ) : (
          timeline.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2 rounded bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/40 transition-colors"
            >
              <div className="mt-0.5 p-1 rounded bg-slate-800 shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`badge text-[10px] ${getBadgeClass(item.type)}`}>
                    {item.type}
                  </span>
                  <span className="mono text-[11px] text-slate-500">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <div className="text-slate-300 mono text-[11px] break-words">
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
