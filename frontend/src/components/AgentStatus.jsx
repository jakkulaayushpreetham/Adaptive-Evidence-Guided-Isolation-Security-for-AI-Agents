import React from 'react';
import { Wifi, WifiOff, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export default function AgentStatus({ wsConnected, securityState, agentId }) {
  return (
    <div className="flex items-center gap-4 text-xs mono">
      <div className="flex items-center gap-1.5">
        {wsConnected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">LIVE SOC CONNECTED</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400 font-medium">WS DISCONNECTED</span>
          </>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1 text-slate-500">
        <span>|</span>
        <span className="text-slate-400">Agent:</span>
        <span className="text-slate-200 font-semibold">{agentId || 'AGENT-001'}</span>
      </div>

      <div className="hidden md:flex items-center gap-1 text-slate-500">
        <span>|</span>
        <span className="text-slate-400">Policy:</span>
        <span
          className={`font-semibold ${
            securityState === 'NORMAL'
              ? 'text-emerald-400'
              : securityState === 'RESTRICTED'
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}
        >
          {securityState}
        </span>
      </div>
    </div>
  );
}
