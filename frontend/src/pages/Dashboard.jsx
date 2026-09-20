import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SOCWebSocket } from '../api/websocket';
import SecurityState from '../components/SecurityState';
import CapabilityPanel from '../components/CapabilityPanel';
import TrustPanel from '../components/TrustPanel';
import EventStream from '../components/EventStream';
import TaskPanel from '../components/TaskPanel';
import AgentPassport from '../components/AgentPassport';
import TrustChart from '../components/TrustChart';
import RevocationPanel from '../components/RevocationPanel';
import IncidentTimeline from '../components/IncidentTimeline';
import AgentStatus from '../components/AgentStatus';
import DemoControls from '../components/DemoControls';
import EventInjectorDrawer from '../components/EventInjectorDrawer';
import { Shield, RefreshCw, Cpu, Activity, ShieldCheck, Database, Layers, Radio } from 'lucide-react';

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
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);

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

      if (tData.status === 'fulfilled' && tData.value) {
        setTask(tData.value);
      } else {
        localStorage.removeItem('aegis_active_task_id');
        throw new Error('Task not found on backend');
      }

      if (capsData.status === 'fulfilled') setCapabilities(capsData.value || []);
      if (trustData.status === 'fulfilled' && trustData.value) {
        setTrust(trustData.value);
        if (trustData.value.security_state) {
          setSecurityState(trustData.value.security_state);
        }
      }
      if (historyData.status === 'fulfilled' && Array.isArray(historyData.value)) {
        setTrustHistory(historyData.value);
      }
      if (eventsData.status === 'fulfilled') setEvents(eventsData.value || []);
      if (timelineData.status === 'fulfilled') setTimeline(timelineData.value || []);
    } catch (err) {
      console.warn('Failed to load snapshot:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize or restore active task with auto-healing
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
      await loadTaskSnapshot(task.task_id);
    } catch (err) {
      console.error('Failed to run task:', err);
    } finally {
      setIsRunningTask(false);
    }
  };

  const handleSimulateAttack = async (operation, resource) => {
    if (!task) return null;
    try {
      const result = await api.simulateOperation(
        task.agent_id,
        task.task_id,
        operation,
        resource
      );

      setSecurityState(result.security_state);
      if (result.isolation_required) {
        setIsolationRequired(true);
        setIsolationStatus('REQUESTED');
      }

      const [caps, tr] = await Promise.all([
        api.getCapabilities(task.task_id),
        api.getTrustState(task.task_id),
      ]);
      setCapabilities(caps);
      setTrust(tr);
      return result;
    } catch (err) {
      console.error('Simulation failed:', err);
      return null;
    }
  };

  const handleResetDemo = async () => {
    await handleCreateDemoTask();
  };

  const activeCapsCount = capabilities.filter((c) => c.status === 'ACTIVE').length;
  const revokedCaps = capabilities.filter((c) => c.status === 'REVOKED');

  return (
    <div className="flex flex-col space-y-4">
      {/* Sleek Sub-Header HUD Bar (Zero Redundancy) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">ACTIVE TASK:</span>
            <span className="font-bold text-white tracking-wider">
              {task?.task_id || 'INITIALIZING...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs font-mono">
            <span className="text-slate-400">AUTHORITY:</span>
            <span
              className={`font-bold ${
                securityState === 'NORMAL'
                  ? 'text-emerald-400'
                  : securityState === 'RESTRICTED'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {securityState === 'NORMAL'
                ? 'LEAST-PRIVILEGE (2 CAPS)'
                : securityState === 'RESTRICTED'
                ? 'CONFINED (READ-ONLY)'
                : 'ISOLATED (ZERO PRIVILEGE)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEventDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-cyan-900/60 hover:from-purple-800/80 hover:to-cyan-800/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-[1.02] cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Attack &amp; Event Injector (16+ Scenarios)</span>
          </button>

          <AgentStatus
            wsConnected={wsConnected}
            securityState={securityState}
            agentId={task?.agent_id}
          />

          <button
            onClick={() => task && loadTaskSnapshot(task.task_id)}
            disabled={isLoading}
            title="Synchronize real-time state with backend REST API"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cyber Defense Simulation Deck */}
      <DemoControls
        onCreateDemoTask={handleCreateDemoTask}
        onRunNormalTask={handleRunNormalTask}
        onSimulateAttack={handleSimulateAttack}
        onResetDemo={handleResetDemo}
        onOpenEventInjector={() => setIsEventDrawerOpen(true)}
        isTaskActive={Boolean(task)}
        isRunning={isRunningTask}
        isCritical={securityState === 'CRITICAL'}
      />

      {/* High-Impact 2-Column Responsive Command Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* ================= LEFT COLUMN: Core Telemetry & Dynamics (7 Cols) ================= */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          {/* Top Row: Security State & Task Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecurityState
              state={securityState}
              isolationRequired={isolationRequired}
              isolationStatus={isolationStatus}
              containerRunning={false}
            />

            <TaskPanel
              task={task}
              onRunTask={handleRunNormalTask}
              isRunning={isRunningTask}
              activeCapsCount={activeCapsCount}
            />
          </div>

          {/* Middle Row: Capabilities & Dempster-Shafer Consensus */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <CapabilityPanel
                capabilities={capabilities}
                securityState={securityState}
              />
            </div>
            <div className="md:col-span-6">
              <TrustPanel trust={trust} />
            </div>
          </div>

          {/* Bottom Left: Dempster-Shafer Trajectory Chart */}
          <TrustChart history={trustHistory} />
        </div>

        {/* ================= RIGHT COLUMN: Live Stream, Reasoning & Audit (5 Cols) ================= */}
        <div className="xl:col-span-5 flex flex-col space-y-4">
          {/* Real-time Reference Monitor Interception Stream */}
          <EventStream events={events} />

          {/* Explainable Revocation / Causal Chain */}
          <RevocationPanel
            lastViolationEvent={lastViolationEvent}
            securityState={securityState}
            trust={trust}
            revokedCaps={revokedCaps}
          />

          {/* Incident Timeline & Provenance Audit */}
          <IncidentTimeline timeline={timeline} />
        </div>
      </div>

      {/* Slide-over Interactive Attack & Event Injection Console */}
      <EventInjectorDrawer
        isOpen={isEventDrawerOpen}
        onClose={() => setIsEventDrawerOpen(false)}
        task={task}
        onSimulateOperation={handleSimulateAttack}
        isRunning={isRunningTask}
      />
    </div>
  );
}
