import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function EventStream({ events = [] }) {
  const streamEndRef = useRef(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return d.toTimeString().split(' ')[0];
    } catch {
      return ts;
    }
  };

  const getDecisionStyle = (decision) => {
    switch (decision?.toUpperCase()) {
      case 'ALLOW':
        return {
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />,
        };
      case 'DENY':
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400 inline mr-1" />,
        };
      case 'POLICY':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: <Shield className="w-3.5 h-3.5 text-amber-400 inline mr-1" />,
        };
      case 'REVOKE':
        return {
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400 inline mr-1" />,
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: null,
        };
    }
  };

  return (
    <div className="soc-card flex flex-col h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live Security Event Stream
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] text-slate-400 mono">
            {events.length} Events Logged
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-1.5 mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Awaiting security events from Reference Monitor...
          </div>
        ) : (
          events.map((evt, idx) => {
            const style = getDecisionStyle(evt.decision || evt.type);
            return (
              <div
                key={evt.event_id || `${idx}-${evt.timestamp}`}
                className="flex items-center justify-between p-2 rounded bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-500 text-[11px] shrink-0">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${style.badge}`}
                  >
                    {style.icon}
                    {evt.decision || evt.type}
                  </span>
                  <span className="font-semibold text-slate-200 shrink-0">
                    {evt.operation}
                  </span>
                  <span className="text-slate-400 truncate text-[11px]">
                    {evt.resource}
                  </span>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-[11px] ${
                      evt.decision === 'DENY'
                        ? 'text-rose-400 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {evt.reason || 'AUTHORIZED'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={streamEndRef} />
      </div>
    </div>
  );
}
