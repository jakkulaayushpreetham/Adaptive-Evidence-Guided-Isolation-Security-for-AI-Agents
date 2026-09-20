import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

export default function TrustChart({ history = [] }) {
  // Always include baseline point t0 (complete uncertainty) if history has 0 or 1 point
  let preparedData = [...history];

  if (preparedData.length === 0) {
    preparedData = [
      {
        m_T: 0.0,
        m_U: 0.0,
        m_Theta: 1.0,
        conflict_K: 0.0,
        label: 'Init',
        time: 'T-00',
      },
    ];
  } else if (preparedData.length === 1) {
    preparedData = [
      {
        m_T: 0.0,
        m_U: 0.0,
        m_Theta: 1.0,
        conflict_K: 0.0,
        label: 'Baseline',
        time: 'Init',
      },
      {
        ...preparedData[0],
        label: 'Current',
        time: 'Active',
      },
    ];
  }

  const chartData = preparedData.map((item, index) => {
    let timeLabel = item.time || `t${index}`;
    if (item.timestamp && !item.time) {
      try {
        timeLabel = new Date(item.timestamp).toTimeString().split(' ')[0];
      } catch {
        timeLabel = `t${index}`;
      }
    }
    return {
      name: timeLabel,
      'Trust Compliance m(T)': parseFloat(Number(item.m_T || 0).toFixed(3)),
      'Threat Suspicion m(U)': parseFloat(Number(item.m_U || 0).toFixed(3)),
      'Uncertainty m(Θ)': parseFloat(Number(item.m_Theta ?? 1.0).toFixed(3)),
      conflict: parseFloat(Number(item.conflict_K || 0).toFixed(3)),
    };
  });

  const latest = chartData[chartData.length - 1] || {};

  return (
    <div className="glass-panel flex flex-col h-[320px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Agent Trust &amp; Suspicion Trajectory
            </h3>
            <div className="text-[11px] text-slate-400">
              Live Evolution: Compliance (Green) • Suspicion (Red) • Uncertainty (Cyan)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            Trust: <span className="text-emerald-400 font-bold">{latest['Trust Compliance m(T)']}</span> |{' '}
            Suspicion: <span className="text-rose-400 font-bold">{latest['Threat Suspicion m(U)']}</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-white/[0.06] text-[10px] font-semibold">
            {history.length} Snapshots
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 15, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorDistrust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              ticks={[0, 0.25, 0.5, 0.75, 1.0]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 15, 30, 0.95)',
                borderColor: '#334155',
                borderRadius: '10px',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />

            {/* Threshold Reference Lines */}
            <ReferenceLine
              y={0.6}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: 'Revocation Threshold (60%)',
                fill: '#f59e0b',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <ReferenceLine
              y={0.85}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: 'Lockdown Threshold (85%)',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            <Area
              type="monotone"
              dataKey="Trust Compliance m(T)"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTrust)"
            />
            <Area
              type="monotone"
              dataKey="Threat Suspicion m(U)"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDistrust)"
            />
            <Area
              type="monotone"
              dataKey="Uncertainty m(Θ)"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUncertainty)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
