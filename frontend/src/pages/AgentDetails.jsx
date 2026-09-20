import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AgentPassport from '../components/AgentPassport';
import { UserCheck, Shield, Key } from 'lucide-react';

export default function AgentDetails({ taskId }) {
  const [capabilities, setCapabilities] = useState([]);
  const [trust, setTrust] = useState(null);
  const [task, setTask] = useState(null);

  useEffect(() => {
    if (!taskId) return;
    Promise.all([
      api.getTask(taskId),
      api.getCapabilities(taskId),
      api.getTrustState(taskId),
    ]).then(([t, c, tr]) => {
      setTask(t);
      setCapabilities(c);
      setTrust(tr);
    }).catch(console.error);
  }, [taskId]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <UserCheck className="w-6 h-6 text-sky-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Agent Security Context</h2>
          <p className="text-xs text-slate-400">Deep inspection of principal sandbox confinement and capabilities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AgentPassport
          agentId={task?.agent_id}
          taskId={task?.task_id}
          trust={trust}
          activeCapsCount={capabilities.filter((c) => c.status === 'ACTIVE').length}
        />

        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.08]">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Capability Grants</h3>
          </div>
          <div className="space-y-2">
            {capabilities.map((c) => (
              <div key={c.capability_id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex justify-between font-mono font-semibold">
                  <span className="text-slate-200">{c.operation}</span>
                  <span className={c.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>{c.status}</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] mt-1">{c.resource}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
