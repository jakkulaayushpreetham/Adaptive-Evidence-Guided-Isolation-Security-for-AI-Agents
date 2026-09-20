import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, AlertTriangle, CheckCircle2, XCircle, Radio, Activity } from 'lucide-react';

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
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />,
        };
      case 'DENY':
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400 inline mr-1" />,
        };
      case 'POLICY':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          icon: <Shield className="w-3.5 h-3.5 text-amber-400 inline mr-1" />,
        };
      case 'REVOKE':
        return {
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
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
    <div className="soc-card flex flex-col h-[300px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Reference Monitor Event Log
            </h3>
            <div className="text-[11px] text-slate-400">
              Kernel-Mediated Operations Interception Feed
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            STREAM ACTIVE
          </span>
          <span className="text-[11px] text-slate-400 mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
            {events.length} Events
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2.5 pr-1 space-y-1.5 mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping opacity-30" />
            </div>
            <div className="text-xs font-semibold text-slate-300">
              Security Gateway Standing By
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Every system call, network request, and file I/O requested by the autonomous agent will be intercepted and logged here in real-time.
            </p>
          </div>
        ) : (
          events.map((evt, idx) => {
            const style = getDecisionStyle(evt.decision || evt.type);
            const isDeny = evt.decision === 'DENY';
            return (
              <div
                key={evt.event_id || `${idx}-${evt.timestamp}`}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                  isDeny
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-500 text-[10px] shrink-0 font-medium">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${style.badge}`}
                  >
                    {style.icon}
                    {evt.decision || evt.type}
                  </span>
                  <span className="font-bold text-slate-200 shrink-0 text-xs">
                    {evt.operation}
                  </span>
                  <span className="text-slate-400 truncate text-[11px]">
                    {evt.resource}
                  </span>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isDeny
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                        : 'text-slate-400 bg-slate-800/80 border border-slate-700/50'
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
