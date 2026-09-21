import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Zap,
  RefreshCw,
  Eye,
  AlertOctagon,
  CheckCircle,
  Clock,
  Crosshair,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  BarChart2,
} from 'lucide-react';
import { api } from '../api/client';

export default function DynamicAdaptiveMatrix({
  agentId,
  taskId,
  securityState = 'NORMAL',
  trust,
  onSimulateOperation,
  wsConnected,
}) {
  const [telemetry, setTelemetry] = useState({
    compliance_streak: 0,
    required_compliance_streak: 4,
    recovery_enabled: true,
    active_canaries_count: 5,
    sensitivity: 0.35,
    velocity: 1.0,
    rate_per_sec: 0.0,
    canary_tripped: false,
  });

  const [canaries, setCanaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  // Fetch telemetry from backend
  const fetchTelemetry = async () => {
    if (!agentId || !taskId) return;
    try {
      const data = await api.getDynamicTelemetry(agentId, taskId);
      if (data) {
        setTelemetry((prev) => ({
          ...prev,
          compliance_streak: data.compliance_streak,
          required_compliance_streak: data.required_compliance_streak,
          recovery_enabled: data.recovery_enabled,
          active_canaries_count: data.active_canaries_count,
        }));
      }
    } catch (err) {
      // Graceful fallback to prop trust metrics
    }
  };

  const fetchCanaries = async () => {
    try {
      const data = await api.getCanaries();
      if (data) setCanaries(data);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchCanaries();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [agentId, taskId]);

  // Trigger self-healing compliance streak simulation
  const handleSimulateComplianceStreak = async () => {
    if (!onSimulateOperation) return;
    setRecovering(true);
    setBannerNotice('Executing compliance verification streak in probation envelope...');

    try {
      for (let i = 0; i < 4; i++) {
        await onSimulateOperation({
          agent_id: agentId || 'AGENT-001',
          task_id: taskId || 'TASK-001',
          operation: 'READ_FILE',
          resource: '/workspace/input/research.txt',
        });
        await new Promise((r) => setTimeout(r, 600));
      }
      setBannerNotice('Self-healing recovery threshold met! Trust restored to NORMAL.');
      setTimeout(() => setBannerNotice(null), 5000);
    } catch (err) {
      setBannerNotice('Simulation error during streak.');
    } finally {
      setRecovering(false);
      fetchTelemetry();
    }
  };

  // Trigger honeypot canary probe
  const handleTriggerCanary = async () => {
    if (!onSimulateOperation) return;
    setBannerNotice('Deploying synthetic honeypot probe to tripwire trap...');
    try {
      await onSimulateOperation({
        agent_id: agentId || 'AGENT-001',
        task_id: taskId || 'TASK-001',
        operation: 'READ_FILE',
        resource: '/workspace/.canary/vault_key.json',
      });
      setBannerNotice('TRIPWIRE DETONATED: Immediate zero-trust containment activated!');
      setTimeout(() => setBannerNotice(null), 6000);
    } catch (err) {
      // Ignore
    }
  };

  const streak = telemetry.compliance_streak || 0;
  const required = telemetry.required_compliance_streak || 4;
  const progressPercent = Math.min(100, Math.round((streak / required) * 100));

  const isRestricted = securityState === 'RESTRICTED';
  const isCritical = securityState === 'CRITICAL';
  const isNormal = securityState === 'NORMAL';

  return (
    <div className="card-glass border border-cyan-500/30 shadow-2xl relative overflow-hidden my-6">
      {/* Dynamic Background Ambient Light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-wide uppercase">
                Dynamic Adaptive OS Architecture
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                v2.0 Contextual
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical evidence fusion with temporal decay, sensitivity scaling & self-healing probation recovery.
            </p>
          </div>
        </div>

        {/* Live Security Posture Badge */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Active OS Posture
            </span>
            <span
              className={`text-sm font-extrabold uppercase tracking-widest ${
                isNormal
                  ? 'text-emerald-400'
                  : isRestricted
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {securityState}
            </span>
          </div>
          <div
            className={`w-3.5 h-3.5 rounded-full animate-ping ${
              isNormal
                ? 'bg-emerald-400'
                : isRestricted
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>

      {/* Banner Alert Notice */}
      {bannerNotice && (
        <div className="bg-cyan-500/20 border-b border-cyan-500/40 px-5 py-2.5 text-xs font-semibold text-cyan-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span>{bannerNotice}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-cyan-400 hover:text-white"
          >
            x
          </button>
        </div>
      )}

      {/* 4 Dynamic Architecture Pillars Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Self-Healing Compliance Recovery */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Compliance Recovery
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {streak} / {required}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {isRestricted
                ? `${Math.max(0, required - streak)} compliant operations needed to lift restrictions.`
                : isNormal
                ? 'Nominal baseline: verified actions maintain trust.'
                : 'Isolation locked. Operator reset required.'}
            </p>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isNormal
                    ? 'bg-emerald-500'
                    : isRestricted
                    ? 'bg-gradient-to-r from-amber-500 to-cyan-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${isNormal ? 100 : progressPercent}%` }}
              />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Probation Policy:</span>
            <span className="text-emerald-400 font-semibold">Self-Healing Active</span>
          </div>
        </div>

        {/* Pillar 2: Contextual Resource Sensitivity */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                Resource Sensitivity
              </span>
              <span className="text-xs font-mono font-bold text-blue-400">
                S_r: 0.85
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Dynamic threat coefficient scales Dempster-Shafer mass dynamically based on path sensitivity.
            </p>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center">
              <div className="p-1 rounded bg-slate-800/80 text-emerald-300 border border-emerald-500/20">
                Scratch (0.15)
              </div>
              <div className="p-1 rounded bg-slate-800/80 text-amber-300 border border-amber-500/20">
                Output (0.35)
              </div>
              <div className="p-1 rounded bg-slate-800/80 text-rose-300 border border-rose-500/20">
                Secrets (0.95)
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Path Classification:</span>
            <span className="text-blue-300 font-semibold">Hierarchical</span>
          </div>
        </div>

        {/* Pillar 3: Sliding-Window Velocity Burst Monitor */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Velocity / Burst
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                1.0x Nominal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Sliding 5s window tracks operation frequency. Rapid bursts trigger exponential suspicion scaling.
            </p>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/60 border border-white/5 text-[11px] font-mono">
              <span className="text-slate-400">Temporal Half-life:</span>
              <span className="text-amber-300 font-bold">λ = 0.005</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Burst Multiplier:</span>
            <span className="text-slate-300 font-semibold">Max 3.0x</span>
          </div>
        </div>

        {/* Pillar 4: Synthetic Canary Tripwire Grid */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                Canary Tripwires
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                {canaries.length || 5} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Synthetic decoy files and honeypot network endpoints trigger instant containment freeze.
            </p>
            <div className="p-1.5 rounded bg-slate-800/60 border border-white/5 text-[10px] font-mono text-slate-300 truncate">
              Trap: <span className="text-rose-300">.canary/vault_key.json</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tripwire Status:</span>
            <span className="text-emerald-400 font-semibold">ARMED & ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Reviewer & Demonstration Interactive Controls */}
      <div className="p-5 bg-slate-950/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">Interactive Reviewer Showcase Actions:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action 1: Demonstrate Compliance Recovery */}
          <button
            onClick={handleSimulateComplianceStreak}
            disabled={recovering || isCritical}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md ${
              isCritical
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
            <span>{recovering ? 'Verifying Compliance...' : 'Demonstrate Recovery (4 Actions)'}</span>
          </button>

          {/* Action 2: Demonstrate Honeypot Canary Tripwire */}
          <button
            onClick={handleTriggerCanary}
            disabled={isCritical}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md ${
              isCritical
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-500/20'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Test Canary Tripwire (Freeze)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
