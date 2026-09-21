import React, { useState } from 'react';
import {
  Key,
  FileText,
  PenTool,
  Globe,
  Terminal,
  ShieldAlert,
  Clock,
  Database,
  KeyRound,
  Cpu,
  HardDrive,
  Share2,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { api } from '../api/client';

export default function CapabilityPanel({ capabilities = [], securityState, taskId, onRefresh }) {
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [grantOp, setGrantOp] = useState('DATABASE_QUERY');
  const [grantRes, setGrantRes] = useState('');
  const [grantTtl, setGrantTtl] = useState(900);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const getOpMeta = (op) => {
    switch (op) {
      case 'READ_FILE':
        return {
          icon: FileText,
          label: 'READ_FILE',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          activeBg: 'bg-emerald-950/25 border-emerald-500/40',
          iconColor: 'text-emerald-400',
        };
      case 'WRITE_FILE':
        return {
          icon: PenTool,
          label: 'WRITE_FILE',
          badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
          activeBg: 'bg-teal-950/25 border-teal-500/40',
          iconColor: 'text-teal-400',
        };
      case 'DATABASE_QUERY':
        return {
          icon: Database,
          label: 'DATABASE_QUERY',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          activeBg: 'bg-indigo-950/25 border-indigo-500/40',
          iconColor: 'text-indigo-400',
        };
      case 'KEYSTORE_ACCESS':
        return {
          icon: KeyRound,
          label: 'KEYSTORE_ACCESS',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          activeBg: 'bg-amber-950/25 border-amber-500/40',
          iconColor: 'text-amber-400',
        };
      case 'MEMORY_READ':
        return {
          icon: Cpu,
          label: 'MEMORY_READ',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          activeBg: 'bg-cyan-950/25 border-cyan-500/40',
          iconColor: 'text-cyan-400',
        };
      case 'MEMORY_WRITE':
        return {
          icon: HardDrive,
          label: 'MEMORY_WRITE',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          activeBg: 'bg-sky-950/25 border-sky-500/40',
          iconColor: 'text-sky-400',
        };
      case 'IPC_CALL':
        return {
          icon: Share2,
          label: 'IPC_CALL',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          activeBg: 'bg-purple-950/25 border-purple-500/40',
          iconColor: 'text-purple-400',
        };
      case 'NETWORK':
        return {
          icon: Globe,
          label: 'NETWORK',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          activeBg: 'bg-blue-950/25 border-blue-500/40',
          iconColor: 'text-blue-400',
        };
      default:
        return {
          icon: Key,
          label: op,
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          activeBg: 'bg-slate-900 border-white/[0.08]',
          iconColor: 'text-slate-400',
        };
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!grantRes.trim()) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const activeTaskId = taskId || localStorage.getItem('aegis_active_task_id');
      if (!activeTaskId) {
        throw new Error('No active task found to attach capability.');
      }
      await api.grantCapability(activeTaskId, {
        operation: grantOp,
        resource: grantRes.trim(),
        lifetime_seconds: Number(grantTtl),
      });
      setGrantRes('');
      setIsGrantOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to grant capability lease.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (capId) => {
    try {
      const activeTaskId = taskId || localStorage.getItem('aegis_active_task_id');
      if (!activeTaskId) return;
      await api.revokeCapability(activeTaskId, capId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Revocation error:', err);
    }
  };

  const activeCount = capabilities.filter((c) => c.status === 'ACTIVE').length;

  const SUGGESTIONS = {
    DATABASE_QUERY: 'db://infrastructure/iam_roles',
    KEYSTORE_ACCESS: 'vault://tokens/api_key',
    MEMORY_READ: 'mem://context/threat_intel',
    MEMORY_WRITE: 'mem://context/synthesized_index',
    IPC_CALL: 'ipc://agent/co_verifier',
    NETWORK: 'https://api.internal-cloud.com/v1/metrics',
    READ_FILE: '/workspace/input/cloudtrail_events.json',
    WRITE_FILE: '/workspace/output/incident_report.json',
  };

  return (
    <div className="glass-panel p-4 flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Task-Scoped Capabilities
            </h3>
            <div className="text-[11px] text-slate-400">
              Dynamic Cryptographic Leases Scoped to Task Context
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-white/[0.08] text-slate-300">
            <span className="text-emerald-400 font-bold">{activeCount}</span> / {capabilities.length} Active Leases
          </span>

          <button
            onClick={() => setIsGrantOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.25)] cursor-pointer"
            title="Grant a new dynamic capability lease"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isGrantOpen ? 'Close' : '+ Grant Lease'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Quick Grant Panel */}
      {isGrantOpen && (
        <form onSubmit={handleGrant} className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Issue Real-Time Capability Lease to Active Agent
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Kernel Reference Monitor Enforced</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Operation</label>
              <select
                value={grantOp}
                onChange={(e) => {
                  setGrantOp(e.target.value);
                  if (SUGGESTIONS[e.target.value]) {
                    setGrantRes(SUGGESTIONS[e.target.value]);
                  }
                }}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="DATABASE_QUERY">DATABASE_QUERY</option>
                <option value="KEYSTORE_ACCESS">KEYSTORE_ACCESS</option>
                <option value="IPC_CALL">IPC_CALL</option>
                <option value="MEMORY_READ">MEMORY_READ</option>
                <option value="MEMORY_WRITE">MEMORY_WRITE</option>
                <option value="READ_FILE">READ_FILE</option>
                <option value="WRITE_FILE">WRITE_FILE</option>
                <option value="NETWORK">NETWORK</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Resource Identifier / URI</label>
              <input
                type="text"
                value={grantRes}
                onChange={(e) => setGrantRes(e.target.value)}
                placeholder={SUGGESTIONS[grantOp] || 'Resource URI...'}
                required
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Lease Lifetime TTL</label>
              <select
                value={grantTtl}
                onChange={(e) => setGrantTtl(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value={300}>5 Minutes (Demo TTL)</option>
                <option value={900}>15 Minutes (Task Scoped)</option>
                <option value={3600}>1 Hour</option>
                <option value={86400}>24 Hours</option>
              </select>
            </div>
          </div>

          {actionError && (
            <div className="text-[11px] text-rose-400 font-mono bg-rose-950/40 p-1.5 rounded border border-rose-500/30">
              {actionError}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              Suggestion: <button type="button" onClick={() => setGrantRes(SUGGESTIONS[grantOp])} className="text-cyan-400 hover:underline">{SUGGESTIONS[grantOp]}</button>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsGrantOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !grantRes.trim()}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Mint Capability Lease</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Dynamic Grid of Actual Capabilities */}
      {capabilities.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-950/50 border border-dashed border-white/[0.08] text-slate-400 space-y-1.5">
          <Key className="w-6 h-6 text-cyan-400 mx-auto opacity-70" />
          <p className="text-xs font-semibold text-slate-300">No capabilities currently assigned.</p>
          <p className="text-[11px] text-slate-500">
            Admit an LLM task in the chamber or click <span className="text-cyan-300 font-mono font-bold">+ Grant Lease</span> above to scope permissions dynamically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {capabilities.map((cap) => {
            const meta = getOpMeta(cap.operation);
            const Icon = meta.icon;
            const isActive = cap.status === 'ACTIVE';
            const isRevoked = cap.status === 'REVOKED';
            const isExpired = cap.status === 'EXPIRED';

            return (
              <div
                key={cap.capability_id || `${cap.operation}-${cap.resource}`}
                className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between relative group ${
                  isActive
                    ? `${meta.activeBg} shadow-[0_0_15px_rgba(16,185,129,0.08)]`
                    : isRevoked
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/40 border-white/[0.05] opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? meta.iconColor : 'text-amber-400'}`} />
                      <span className={`font-mono font-bold text-xs truncate ${isRevoked ? 'line-through text-amber-300' : 'text-slate-200'}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-md tracking-wider uppercase border ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isRevoked
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700/50'
                        }`}
                      >
                        {cap.status}
                      </span>

                      {isActive && (
                        <button
                          onClick={() => handleRevoke(cap.capability_id)}
                          title="Revoke this capability lease"
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md border border-white/[0.06] truncate select-all" title={cap.resource}>
                    {cap.resource}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  {cap.expires_at ? (
                    <div className="flex items-center gap-1 truncate text-slate-400">
                      <Clock className="w-2.5 h-2.5" />
                      <span>TTL: {new Date(cap.expires_at).toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    <span>Session Lease</span>
                  )}

                  {cap.revocation_reason && (
                    <div className="text-[10px] text-amber-300 italic truncate flex items-center gap-1" title={cap.revocation_reason}>
                      <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{cap.revocation_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OS Kernel Security Perimeter (Default-Deny Boundaries) */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
          <span className="flex items-center gap-1 font-bold text-slate-400">
            <Lock className="w-3 h-3 text-indigo-400" />
            Kernel Sandbox Perimeter &bull; Denied by Default:
          </span>
          <span className="text-[9px] text-slate-500">Zero-Trust Isolation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-slate-500" /> EXECUTE</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-500/20 font-bold">DENIED</span>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1"><Ban className="w-3 h-3 text-slate-500" /> DELETE_FILE</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-500/20 font-bold">DENIED</span>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-slate-500" /> HOST_ROOT</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-500/20 font-bold">BLOCKED</span>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-500" /> UNMAPPED_NET</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-500/20 font-bold">EGRESS_DROP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
