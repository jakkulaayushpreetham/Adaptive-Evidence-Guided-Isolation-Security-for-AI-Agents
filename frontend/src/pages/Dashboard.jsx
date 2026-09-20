import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SOCWebSocket } from '../api/websocket';
import SecurityState from '../components/SecurityState';
import CapabilityPanel from '../components/CapabilityPanel';
import TrustPanel from '../components/TrustPanel';
import ConflictMeter from '../components/ConflictMeter';
import EventStream from '../components/EventStream';
import TaskPanel from '../components/TaskPanel';
import AgentPassport from '../components/AgentPassport';
import TrustChart from '../components/TrustChart';
import RevocationPanel from '../components/RevocationPanel';
import IncidentTimeline from '../components/IncidentTimeline';
import AgentStatus from '../components/AgentStatus';
import DemoControls from '../components/DemoControls';
import { Shield, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [task, setTask] = useState(null);
  const [capabilities, setCapabilities] = useState([]);
  const [trust, setTrust] = useState(null);
  const [trustHistory, setTrustHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [securityState, setSecurityState] = useState('NORMAL');
  const [isolationRequired, setIsolationRequired] = useState(false);
  const [isolationStatus, setIsolationStatus] = useState(null);
  const [lastViolationEvent, setLastViolationEvent] = useState(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningTask, setIsRunningTask] = useState(false);

  // Load snapshot from backend via REST
  const loadTaskSnapshot = useCallback(async (taskId) => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const [tData, capsData, trustData, historyData, eventsData, timelineData] =
        await Promise.allSettled([
          api.getTask(taskId),
          api.getCapabilities(taskId),
          api.getTrustState(taskId),
          api.getTrustHistory(taskId),
          api.getEvents(taskId),
          api.getTimeline(taskId),
        ]);

      if (tData.status === 'fulfilled') setTask(tData.value);
      if (capsData.status === 'fulfilled') setCapabilities(capsData.value);
      if (trustData.status === 'fulfilled') {
        setTrust(trustData.value);
        if (trustData.value.security_state) {
          setSecurityState(trustData.value.security_state);
        }
      }
      if (historyData.status === 'fulfilled' && Array.isArray(historyData.value)) {
        setTrustHistory(historyData.value);
      }
      if (eventsData.status === 'fulfilled') setEvents(eventsData.value);
      if (timelineData.status === 'fulfilled') setTimeline(timelineData.value);
    } catch (err) {
      console.error('Failed to load snapshot:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize or restore active task
  const initializeTask = useCallback(async () => {
    const savedTaskId = localStorage.getItem('aegis_active_task_id');
    if (savedTaskId) {
      try {
        await loadTaskSnapshot(savedTaskId);
        return;
      } catch {
        localStorage.removeItem('aegis_active_task_id');
      }
    }

    // Auto-create initial task if none saved
    try {
      const newTask = await api.createTask(
        'Summarize internal research documents and output security analysis posture.'
      );
      localStorage.setItem('aegis_active_task_id', newTask.task_id);
      setTask(newTask);
      await loadTaskSnapshot(newTask.task_id);
    } catch (err) {
      console.error('Failed to initialize task:', err);
    }
  }, [loadTaskSnapshot]);

  useEffect(() => {
    initializeTask();
  }, [initializeTask]);

  // Handle WebSocket messages
  const handleWsMessage = useCallback((envelope) => {
    const { type, payload } = envelope;

    switch (type) {
      case 'SECURITY_EVENT': {
        setEvents((prev) => [...prev, payload]);
        if (payload.decision === 'DENY') {
          setLastViolationEvent(payload);
        }
        setTimeline((prev) => [
          ...prev,
          {
            type: 'SECURITY_EVENT',
            timestamp: payload.timestamp,
            details: `${payload.operation} ${payload.resource} -> ${payload.decision} (${payload.reason})`,
          },
        ]);
        break;
      }

      case 'TRUST_UPDATED': {
        setTrust((prev) => ({
          ...prev,
          mass: {
            trustworthy: payload.m_T,
            untrustworthy: payload.m_U,
            uncertainty: payload.m_Theta,
          },
          belief_trustworthy: payload.belief_trustworthy,
          plausibility_trustworthy: payload.plausibility_trustworthy,
          conflict: payload.conflict_K,
          evidence_count: payload.evidence_count,
        }));

        setTrustHistory((prev) => [
          ...prev,
          {
            m_T: payload.m_T,
            m_U: payload.m_U,
            m_Theta: payload.m_Theta,
            conflict_K: payload.conflict_K,
            evidence_count: payload.evidence_count,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;
      }

      case 'POLICY_TRANSITION': {
        setSecurityState(payload.new_state);
        setTimeline((prev) => [
          ...prev,
          {
            type: 'POLICY_TRANSITION',
            timestamp: new Date().toISOString(),
            details: `Transition from ${payload.previous_state} to ${payload.new_state}: ${payload.reason}`,
          },
        ]);
        break;
      }

      case 'CAPABILITY_REVOKED': {
        setCapabilities((prev) =>
          prev.map((c) =>
            c.capability_id === payload.capability_id
              ? { ...c, status: 'REVOKED', revocation_reason: payload.reason }
              : c
          )
        );
        setTimeline((prev) => [
          ...prev,
          {
            type: 'CAPABILITY_REVOKED',
            timestamp: new Date().toISOString(),
            details: `Capability ${payload.capability_id} revoked: ${payload.reason}`,
          },
        ]);
        break;
      }

      case 'CAPABILITY_GRANTED': {
        setCapabilities((prev) => {
          const exists = prev.find((c) => c.capability_id === payload.capability_id);
          if (exists) return prev;
          return [...prev, payload];
        });
        break;
      }

      case 'AGENT_ISOLATED': {
        setIsolationRequired(true);
        setIsolationStatus(payload.status || 'REQUESTED');
        setTimeline((prev) => [
          ...prev,
          {
            type: 'AGENT_ISOLATED',
            timestamp: new Date().toISOString(),
            details: `Agent ${payload.agent_id} containment: ${payload.reason}`,
          },
        ]);
        break;
      }

      case 'TASK_STATUS_CHANGED': {
        setTask((prev) => (prev ? { ...prev, status: payload.status } : prev));
        break;
      }

      default:
        break;
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const ws = new SOCWebSocket(handleWsMessage, (status) => setWsConnected(status));
    ws.connect();
    return () => ws.disconnect();
  }, [handleWsMessage]);

  // Action handlers
  const handleCreateDemoTask = async () => {
    try {
      setIsLoading(true);
      const newTask = await api.createTask(
        'Summarize internal research documents and output security analysis posture.'
      );
      localStorage.setItem('aegis_active_task_id', newTask.task_id);
      setTask(newTask);
      setSecurityState('NORMAL');
      setIsolationRequired(false);
      setIsolationStatus(null);
      setLastViolationEvent(null);
      await loadTaskSnapshot(newTask.task_id);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunNormalTask = async () => {
    if (!task) return;
    try {
      setIsRunningTask(true);
      await api.runTask(task.task_id);
      // Re-sync snapshot after task execution
      await loadTaskSnapshot(task.task_id);
    } catch (err) {
      console.error('Failed to run task:', err);
    } finally {
      setIsRunningTask(false);
    }
  };

  const handleSimulateAttack = async (operation, resource) => {
    if (!task) return;
    try {
      const result = await api.simulateOperation(
        task.agent_id,
        task.task_id,
        operation,
        resource
      );

      // Instant state reconciliation
      setSecurityState(result.security_state);
      if (result.isolation_required) {
        setIsolationRequired(true);
        setIsolationStatus('REQUESTED');
      }

      // Re-sync capabilities and trust state from backend authority
      const [caps, tr] = await Promise.all([
        api.getCapabilities(task.task_id),
        api.getTrustState(task.task_id),
      ]);
      setCapabilities(caps);
      setTrust(tr);
    } catch (err) {
      console.error('Simulation failed:', err);
    }
  };

  const handleResetDemo = async () => {
    await handleCreateDemoTask();
  };

  const activeCapsCount = capabilities.filter((c) => c.status === 'ACTIVE').length;
  const revokedCaps = capabilities.filter((c) => c.status === 'REVOKED');

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 lg:p-6 flex flex-col space-y-5">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-purple-600/20 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Shield className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                AEGIS-AI SOC
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                v1.0-RESEARCH
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Task-Scoped Adaptive OS Capability Enforcement with Dempster-Shafer Trust Modeling
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AgentStatus
            wsConnected={wsConnected}
            securityState={securityState}
            agentId={task?.agent_id}
          />
          <button
            onClick={() => task && loadTaskSnapshot(task.task_id)}
            disabled={isLoading}
            title="Refresh snapshot from REST API"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Authoritative Demonstration Controls */}
      <section>
        <DemoControls
          onCreateDemoTask={handleCreateDemoTask}
          onRunNormalTask={handleRunNormalTask}
          onSimulateAttack={handleSimulateAttack}
          onResetDemo={handleResetDemo}
          isTaskActive={Boolean(task)}
          isRunning={isRunningTask}
          isCritical={securityState === 'CRITICAL'}
        />
      </section>

      {/* Row 1: Task, Security State, Agent Passport */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TaskPanel
          task={task}
          onRunTask={handleRunNormalTask}
          isRunning={isRunningTask}
        />
        <SecurityState
          state={securityState}
          isolationRequired={isolationRequired}
          isolationStatus={isolationStatus}
          containerRunning={false} // Container was not running in test env; shows ISOLATION REQUESTED / VERIFIED appropriately
        />
        <AgentPassport
          agentId={task?.agent_id}
          taskId={task?.task_id}
          trust={trust}
          activeCapsCount={activeCapsCount}
        />
      </section>

      {/* Row 2: Capabilities, Dempster-Shafer Evidence State, Conflict Meter */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5">
          <CapabilityPanel
            capabilities={capabilities}
            securityState={securityState}
          />
        </div>
        <div className="md:col-span-5">
          <TrustPanel trust={trust} />
        </div>
        <div className="md:col-span-2">
          <ConflictMeter conflict={trust?.conflict ?? 0.0} />
        </div>
      </section>

      {/* Row 3: Live Security Event Stream */}
      <section>
        <EventStream events={events} />
      </section>

      {/* Row 4: Trust History Chart & Explainable Revocation */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrustChart history={trustHistory} />
        <RevocationPanel
          lastViolationEvent={lastViolationEvent}
          securityState={securityState}
          trust={trust}
          revokedCaps={revokedCaps}
        />
      </section>

      {/* Row 5: Incident Timeline & Provenance Audit */}
      <section>
        <IncidentTimeline timeline={timeline} />
      </section>
    </div>
  );
}
