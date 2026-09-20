import React from 'react';
import { Wifi, WifiOff, ShieldCheck, ShieldAlert, ShieldX, Bot } from 'lucide-react';

export default function AgentStatus({ wsConnected, securityState, agentId }) {
  return (
    <div className="flex items-center gap-2.5 text-xs mono">
      {/* WebSocket Status Pill */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
          wsConnected
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}
      >
        {wsConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-[11px] tracking-wide">SOC REAL-TIME</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-[11px] tracking-wide">CONNECTING...</span>
          </>
        )}
      </div>

      {/* Active Agent Pill */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-slate-300">
        <Bot className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-400">Agent:</span>
        <span className="font-bold text-white tracking-wider">{agentId || 'AGENT-001'}</span>
      </div>

      {/* Policy State Pill */}
      <div
        className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold tracking-wider uppercase ${
          securityState === 'NORMAL'
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
            : securityState === 'RESTRICTED'
            ? 'bg-amber-950/40 text-amber-400 border-amber-500/30 animate-pulse'
            : 'bg-rose-950/40 text-rose-400 border-rose-500/30 animate-pulse'
        }`}
      >
        <span className="text-slate-400 font-normal">State:</span>
        <span>{securityState}</span>
      </div>
    </div>
  );
}
