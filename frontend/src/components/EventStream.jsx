import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Shield, AlertTriangle, CheckCircle2, XCircle, Radio, Activity, Filter } from 'lucide-react';

export default function EventStream({ events = [] }) {
  const streamBodyRef = useRef(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Keep new events visible without moving the dashboard itself. Calling
    // scrollIntoView here scrolls ancestor pages as well as this log panel.
    const streamBody = streamBodyRef.current;
    if (!streamBody) return;
    streamBody.scrollTo({
      top: streamBody.scrollHeight,
      behavior: events.length > 1 ? 'smooth' : 'auto',
    });
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
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />,
        };
      case 'DENY':
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
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

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'ALLOW') return e.decision === 'ALLOW';
    if (filter === 'DENY') return e.decision === 'DENY';
    return true;
  });

  return (
    <div className="glass-panel flex flex-col h-[300px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
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
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950/80 border border-white/[0.06] text-[10px] font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('ALLOW')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                filter === 'ALLOW' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALLOW
            </button>
            <button
              onClick={() => setFilter('DENY')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                filter === 'DENY' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DENY
            </button>
          </div>

          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            STREAM ACTIVE
          </span>
          <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded-lg border border-white/[0.06]">
            {events.length} Events
          </span>
        </div>
      </div>

      {/* Event Stream Body */}
      <div ref={streamBodyRef} className="event-stream-body flex-1 overflow-y-auto mt-2.5 pr-1 space-y-1.5 font-mono text-xs">
        {events.length === 0 ? (
          <div className="space-y-2 py-1">
            {/* Baseline Boot Diagnostic Logs so there is NEVER an empty dead void */}
            <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.06] text-slate-400 text-[11px] flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">T-00:00:01</span>
              <span className="text-cyan-400 font-bold">KERNEL_INIT</span>
              <span className="text-slate-300 truncate max-w-[280px]">Reference Monitor hook active on syscall gate</span>
              <span className="badge-pill badge-pill-emerald text-[9px]">READY</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.06] text-slate-400 text-[11px] flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">T-00:00:02</span>
              <span className="text-indigo-400 font-bold">DS_FUSION</span>
              <span className="text-slate-300 truncate max-w-[280px]">Dempster-Shafer frame &Theta;=&#123;T,U&#125; initialized</span>
              <span className="badge-pill badge-pill-purple text-[9px]">READY</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.06] text-slate-400 text-[11px] flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">T-00:00:03</span>
              <span className="text-emerald-400 font-bold">CAP_POLICY</span>
              <span className="text-slate-300 truncate max-w-[280px]">Least-privilege envelope isolated for agent</span>
              <span className="badge-pill badge-pill-cyan text-[9px]">ENFORCED</span>
            </div>

            <div className="pt-2 text-center text-slate-500 text-[11px] italic flex items-center justify-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Reference monitor listening... Trigger an attack or run task to intercept operations.</span>
            </div>
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const style = getDecisionStyle(evt.decision || evt.type);
            const isDeny = evt.decision === 'DENY';
            return (
              <div
                key={evt.event_id || `${idx}-${evt.timestamp}`}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-200 ${
                  isDeny
                    ? 'bg-rose-950/25 border-rose-800/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                    : 'bg-slate-900/70 border-white/[0.06] hover:bg-slate-850 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-500 text-[10px] shrink-0 font-medium">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase shrink-0 ${style.badge}`}
                  >
                    {style.icon}
                    {evt.decision || evt.type}
                  </span>
                  <span className="font-bold text-slate-100 shrink-0 text-xs">
                    {evt.operation}
                  </span>
                  <span className="text-slate-400 truncate text-[11px]">
                    {evt.resource}
                  </span>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      isDeny
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'text-slate-400 bg-slate-800/90 border border-white/[0.06]'
                    }`}
                  >
                    {evt.reason || 'AUTHORIZED'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
