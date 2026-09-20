import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Server, Lock } from 'lucide-react';

export default function SecurityState({ state, isolationRequired, containerRunning, isolationStatus }) {
  const getBadge = () => {
    switch (state) {
      case 'RESTRICTED':
        return {
          icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
          label: 'RESTRICTED',
          desc: 'High-risk write capabilities revoked. Restricted to task input scope.',
          badgeClass: 'badge-restricted',
          cardClass: 'border-restricted',
          authority: 'PARTIAL REVOCATION (WRITE_FILE REVOKED)',
        };
      case 'CRITICAL':
        return {
          icon: <ShieldX className="w-6 h-6 text-rose-500" />,
          label: 'CRITICAL',
          desc: 'Security threshold breached. Zero-trust fail-closed state triggered.',
          badgeClass: 'badge-critical',
          cardClass: 'border-critical',
          authority: 'ALL CAPABILITIES REVOKED',
        };
      case 'NORMAL':
      default:
        return {
          icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
          label: 'NORMAL',
          desc: 'Observed runtime operations remain within validated task scope.',
          badgeClass: 'badge-normal',
          cardClass: 'border-normal',
          authority: 'TASK LEAST-PRIVILEGE ACTIVE',
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
        detail: 'Container monitor confirmed container exited (exit code 0/137)',
      };
    }

    if (isolationStatus === 'REQUESTED' || isolationRequired) {
      return {
        label: 'ISOLATION REQUESTED',
        color: 'text-amber-400 font-semibold',
        detail: 'Docker stop dispatched; awaiting container monitor exit verification',
      };
    }

    return {
      label: 'ISOLATION REQUIRED',
      color: 'text-rose-400 font-semibold',
      detail: 'Policy engine mandated container termination',
    };
  };

  const containment = getContainmentStatus();

  return (
    <div className={`soc-card ${info.cardClass} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Runtime Security State
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state === 'NORMAL'
                  ? 'bg-emerald-500 animate-pulse'
                  : state === 'RESTRICTED'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className={`badge ${info.badgeClass}`}>{info.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            {info.icon}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">{info.label}</div>
            <div className="text-xs text-slate-400 leading-snug">{info.desc}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Authority:
          </span>
          <span className="mono font-semibold text-slate-200">
            {info.authority}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            Containment:
          </span>
          <span className={`mono ${containment.color}`}>
            {containment.label}
          </span>
        </div>
      </div>
    </div>
  );
}
