import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TrustChart({ history = [] }) {
  const chartData = history.map((item, index) => {
    let timeLabel = `t${index}`;
    if (item.timestamp) {
      try {
        timeLabel = new Date(item.timestamp).toTimeString().split(' ')[0];
      } catch {
        timeLabel = `t${index}`;
      }
    }
    return {
      step: `Step ${index} (${timeLabel})`,
      time: timeLabel,
      'm(T) Trust': parseFloat(Number(item.m_T || 0).toFixed(3)),
      'm(U) Distrust': parseFloat(Number(item.m_U || 0).toFixed(3)),
      'm(Θ) Uncertainty': parseFloat(Number(item.m_Theta || 0).toFixed(3)),
      conflict: parseFloat(Number(item.conflict_K || 0).toFixed(3)),
    };
  });

  return (
    <div className="soc-card flex flex-col h-[340px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Trust & Evidence History [Dempster-Shafer Trajectory]
          </span>
        </div>
        <span className="text-[11px] text-slate-500 mono">
          {chartData.length} Snapshots
        </span>
      </div>

      <div className="flex-1 w-full mt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No trust snapshots recorded yet. Run task or security simulations.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis
                domain={[0, 1]}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1422',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="m(T) Trust"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="m(U) Distrust"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ef4444' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="m(Θ) Uncertainty"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0ea5e9' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
