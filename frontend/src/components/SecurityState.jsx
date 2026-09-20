import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Server, Lock, Cpu } from 'lucide-react';

export default function SecurityState({ state, isolationRequired, containerRunning, isolationStatus }) {
  const getBadge = () => {
    switch (state) {
      case 'RESTRICTED':
        return {
          icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
          label: 'RESTRICTED',
          desc: 'High-risk write & network capabilities revoked. Confined to read-only scope.',
          badgeClass: 'badge-restricted',
          cardClass: 'border-restricted',
          authority: 'PARTIAL REVOCATION (WRITE REVOKED)',
          glowColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        };
      case 'CRITICAL':
        return {
          icon: <ShieldX className="w-6 h-6 text-rose-400" />,
          label: 'CRITICAL',
          desc: 'Security threshold breached. Zero-trust fail-closed containment active.',
          badgeClass: 'badge-critical',
          cardClass: 'border-critical',
          authority: 'ALL CAPABILITIES REVOKED',
          glowColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        };
      case 'NORMAL':
      default:
        return {
          icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
          label: 'NORMAL',
          desc: 'Observed runtime operations remain fully compliant within validated scope.',
          badgeClass: 'badge-normal',
          cardClass: 'border-normal',
          authority: 'TASK LEAST-PRIVILEGE ACTIVE',
          glowColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        };
    }
  };

  const info = getBadge();

  // Distinguish ISOLATION REQUIRED, ISOLATION REQUESTED, and ISOLATION VERIFIED
  const getContainmentStatus = () => {
    if (state !== 'CRITICAL' && !isolationRequired) {
      return {
        label: 'SANDBOX ACTIVE',
        color: 'text-emerald-400',
        detail: 'Process bounded in container namespace',
      };
    }

    if (containerRunning === false) {
      return {
        label: 'ISOLATION VERIFIED',
        color: 'text-rose-400 font-bold',
        detail: 'Container exited with verification',
      };
    }

    if (isolationStatus === 'REQUESTED' || isolationRequired) {
      return {
        label: 'ISOLATION REQUESTED',
        color: 'text-amber-400 font-semibold',
        detail: 'Container stop requested (logical authority revoked)',
      };
    }

    return {
      label: 'ISOLATION REQUIRED',
      color: 'text-rose-400 font-semibold',
      detail: 'Mandated container termination',
    };
  };

  const containment = getContainmentStatus();

  return (
    <div className={`soc-card ${info.cardClass} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Kernel Security State
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'NORMAL'
                  ? 'bg-emerald-400 animate-pulse'
                  : state === 'RESTRICTED'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400 animate-pulse'
              }`}
            />
            <span className={`badge ${info.badgeClass}`}>{info.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 my-2">
          <div className={`p-3 rounded-xl border ${info.glowColor} shadow-[0_0_20px_rgba(0,0,0,0.4)]`}>
            {info.icon}
          </div>
          <div>
            <div className="text-xl font-extrabold text-white tracking-tight">{info.label}</div>
            <div className="text-xs text-slate-400 leading-snug mt-0.5">{info.desc}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
        <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Authority:
          </span>
          <span className="mono font-bold text-slate-200 text-[11px] truncate max-w-[200px]">
            {info.authority}
          </span>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            Containment:
          </span>
          <span className={`mono text-[11px] ${containment.color}`}>
            {containment.label}
          </span>
        </div>
      </div>
    </div>
  );
}
