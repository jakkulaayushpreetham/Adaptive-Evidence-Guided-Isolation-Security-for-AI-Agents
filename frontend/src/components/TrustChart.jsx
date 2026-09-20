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
      'm(T) Trust': parseFloat(Number(item.m_T || 0).toFixed(3)),
      'm(U) Distrust': parseFloat(Number(item.m_U || 0).toFixed(3)),
      'm(Θ) Uncertainty': parseFloat(Number(item.m_Theta ?? 1.0).toFixed(3)),
      conflict: parseFloat(Number(item.conflict_K || 0).toFixed(3)),
    };
  });

  const latest = chartData[chartData.length - 1] || {};

  return (
    <div className="soc-card flex flex-col h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Dempster-Shafer Trust Trajectory
            </h3>
            <div className="text-[11px] text-slate-400">
              Continuous Mass Distribution &amp; Epistemic Uncertainty Dynamics
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs mono">
          <span className="text-slate-400">
            Current: <span className="text-emerald-400 font-bold">m(T)={latest['m(T) Trust']}</span> |{' '}
            <span className="text-rose-400 font-bold">m(U)={latest['m(U) Distrust']}</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
            {history.length} Snapshots
          </span>
        </div>
      </div>

      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorDistrust" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
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
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />

            <Area
              type="monotone"
              dataKey="m(T) Trust"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTrust)"
            />
            <Area
              type="monotone"
              dataKey="m(U) Distrust"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDistrust)"
            />
            <Area
              type="monotone"
              dataKey="m(Θ) Uncertainty"
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
