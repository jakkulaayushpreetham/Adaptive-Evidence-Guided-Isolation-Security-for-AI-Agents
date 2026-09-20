import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileText, Clock, CheckCircle } from 'lucide-react';

export default function TaskDetails({ taskId }) {
  const [task, setTask] = useState(null);

  useEffect(() => {
    if (!taskId) return;
    api.getTask(taskId).then(setTask).catch(console.error);
  }, [taskId]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Task Specification & Scope</h2>
          <p className="text-xs text-slate-400">Task-scoped authorization bounds and execution metadata</p>
        </div>
      </div>

      {task ? (
        <div className="soc-card space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="mono text-xs text-slate-400">TASK ID: {task.task_id}</span>
            <span className="badge badge-normal">{task.status}</span>
          </div>

          <div>
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Description</div>
            <div className="text-sm font-semibold text-slate-200">{task.description}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Agent: </span>
              <span className="mono text-slate-300 font-semibold">{task.agent_id}</span>
            </div>
            <div>
              <span className="text-slate-500">Created: </span>
              <span className="mono text-slate-300">{task.created_at}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="soc-card p-6 text-center text-slate-500">Loading task specification...</div>
      )}
    </div>
  );
}
