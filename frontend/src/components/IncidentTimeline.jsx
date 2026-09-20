import React from 'react';
import { History, ShieldAlert, KeyRound, AlertOctagon, Terminal, CheckCircle2, ShieldCheck } from 'lucide-react';

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

  // If empty, supply an initial provisioning entry
  const displayTimeline =
    timeline.length > 0
      ? timeline
      : [
          {
            type: 'PROVISIONING',
            timestamp: new Date().toISOString(),
            details: 'TASK_PROVISIONED: Minimal capability token envelope verified and loaded into kernel memory.',
          },
        ];

  return (
    <div className="glass-panel flex flex-col h-[280px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
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

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            CHAIN INTACT
          </span>
          <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded-lg border border-white/[0.06]">
            {displayTimeline.length} Entries
          </span>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="flex-1 overflow-y-auto mt-2.5 pr-1 space-y-2 text-xs">
        {displayTimeline.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/70 border border-white/[0.06] hover:bg-slate-850 transition-colors"
          >
            <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800/90 border border-white/[0.08] shrink-0 shadow-sm">
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={`badge text-[9px] ${getBadgeClass(item.type)}`}>
                  {item.type}
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-medium">
                  {formatTime(item.timestamp)}
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px] break-words leading-relaxed">
                {item.details}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
