import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import IncidentTimeline from '../components/IncidentTimeline';
import { History } from 'lucide-react';

export default function IncidentHistory({ taskId }) {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    if (!taskId) return;
    api.getTimeline(taskId).then(setTimeline).catch(console.error);
  }, [taskId]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <History className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Full Incident History</h2>
          <p className="text-xs text-slate-400">Complete provenance log across reference monitor, policy engine, and revocation controller</p>
        </div>
      </div>

      <IncidentTimeline timeline={timeline} />
    </div>
  );
}
