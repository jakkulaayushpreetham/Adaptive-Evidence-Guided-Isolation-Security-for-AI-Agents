import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Server, Lock, Cpu, CheckCircle2 } from 'lucide-react';

export default function SecurityState({ state, isolationRequired, containerRunning, isolationStatus }) {
  const getBadge = () => {
    switch (state) {
      case 'RESTRICTED':
        return {
          icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
          label: 'RESTRICTED',
          desc: 'Write capability revoked • Confined to read-only',
          badgeClass: 'badge-restricted',
          cardClass: 'border-restricted',
          authority: 'PARTIAL REVOCATION (WRITE REVOKED)',
          glowColor: 'bg-amber-500/15 border-amber-500/40 shadow-sm',
          postureScore: '50%',
          postureColor: 'text-amber-400',
        };
      case 'CRITICAL':
        return {
          icon: <ShieldX className="w-6 h-6 text-rose-400" />,
          label: 'CRITICAL',
          desc: 'Zero-trust fail-closed • Process containment active',
          badgeClass: 'badge-critical',
          cardClass: 'border-critical',
          authority: 'ALL CAPABILITIES REVOKED',
          glowColor: 'bg-rose-500/20 border-rose-500/50 shadow-sm',
          postureScore: '0%',
          postureColor: 'text-rose-400',
        };
      case 'NORMAL':
      default:
        return {
          icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
          label: 'NORMAL',
          desc: 'Compliant execution • Least-privilege enforced',
          badgeClass: 'badge-normal',
          cardClass: 'border-normal',
          authority: 'TASK LEAST-PRIVILEGE ACTIVE',
          glowColor: 'bg-emerald-500/15 border-emerald-500/40 shadow-sm',
          postureScore: '100%',
          postureColor: 'text-emerald-400',
        };
    }
  };

  const info = getBadge();

  // Distinguish ISOLATION REQUIRED, ISOLATION REQUESTED, and ISOLATION VERIFIED
  const getContainmentStatus = () => {
    if (state !== 'CRITICAL' && !isolationRequired) {
      return {
        label: 'SANDBOX ACTIVE',
        color: 'text-emerald-400 font-bold',
        detail: 'Process bounded in container namespace',
      };
    }

    if (containerRunning === false) {
      return {
        label: 'ISOLATION VERIFIED',
        color: 'text-rose-400 font-extrabold shadow-[0_0_10px_rgba(244,63,94,0.4)]',
        detail: 'Container exited with verification',
      };
    }

    if (isolationStatus === 'REQUESTED' || isolationRequired) {
      return {
        label: 'ISOLATION REQUESTED',
        color: 'text-amber-400 font-bold',
        detail: 'Container stop requested (logical authority revoked)',
      };
    }

    return {
      label: 'ISOLATION REQUIRED',
      color: 'text-rose-400 font-bold',
      detail: 'Mandated container termination',
    };
  };

  const containment = getContainmentStatus();

  return (
    <div className={`glass-panel ${info.cardClass} p-4 flex flex-col justify-between`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Kernel Security State
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'NORMAL'
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : state === 'RESTRICTED'
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.9)]'
              }`}
            />
            <span className={`badge ${info.badgeClass}`}>{info.label}</span>
          </div>
        </div>

        {/* Dynamic Status Avatar & Detail */}
        <div className="flex items-center gap-4 my-3">
          <div className={`p-3.5 rounded-2xl border ${info.glowColor} shrink-0`}>
            {info.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-extrabold text-white tracking-tight">{info.label}</div>
              <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 ${info.postureColor}`}>
                {info.postureScore} Posture
              </span>
            </div>
            <div className="text-xs text-slate-400 leading-snug mt-1">{info.desc}</div>
          </div>
        </div>
      </div>

      {/* Enforcement Bounds Breakdown */}
      <div className="pt-2.5 border-t border-white/[0.08] space-y-1.5 text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            Authority Level:
          </span>
          <span className="font-mono font-bold text-slate-100 text-[11px] truncate max-w-[210px]">
            {info.authority}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Containment:
          </span>
          <span className={`font-mono text-[11px] ${containment.color}`}>
            {containment.label}
          </span>
        </div>
      </div>
    </div>
  );
}
