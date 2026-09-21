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
import LiveAgentChamber from '../components/LiveAgentChamber';
import StickyPipelineFlow from '../components/StickyPipelineFlow';
import { Shield, RefreshCw, Cpu, Activity, ShieldCheck, Database, Layers, Radio, Brain, Zap } from 'lucide-react';

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
  const [activeConsoleMode, setActiveConsoleMode] = useState('chamber'); // 'chamber' | 'deck'

  // Master Sticky Pipeline Flow State (Visible throughout page scroll)
  const [pipelineStage, setPipelineStage] = useState('IDLE');
  const [stageDetail, setStageDetail] = useState(null);

  const handleUpdatePipeline = (stage, detail = null) => {
    setPipelineStage(stage);
    if (detail !== undefined) setStageDetail(detail);
  };

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

  // Restore an explicitly assigned task. New tasks begin in the LLM review flow.
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

  const handleAssignPlannedTask = async (description, capabilities) => {
    setIsLoading(true);
    try {
      const newTask = await api.createTask(description, capabilities);
      localStorage.setItem('aegis_active_task_id', newTask.task_id);
      setTask(newTask);
      setSecurityState('NORMAL');
      setIsolationRequired(false);
      setIsolationStatus(null);
      setLastViolationEvent(null);
      await loadTaskSnapshot(newTask.task_id);
      return newTask;
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

  const handleSimulateAttack = async (operationOrObj, resourceStr) => {
    if (!task) return null;
    const operation = typeof operationOrObj === 'object' && operationOrObj !== null ? operationOrObj.operation : operationOrObj;
    const resource = typeof operationOrObj === 'object' && operationOrObj !== null ? operationOrObj.resource : resourceStr;

    handleUpdatePipeline('REF_MONITOR', {
      operation,
      resource,
      message: `[HOT-PATH INTERCEPT] Trapping syscall: ${operation}("${resource}"). Validating cryptographic capability token...`,
    });
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

      if (result.allowed) {
        handleUpdatePipeline('ALLOW', {
          operation,
          resource,
          message: `[KERNEL APPROVAL] Reference Monitor APPROVED ${operation}("${resource}"). Validated by least-privilege token.`,
        });
      } else {
        handleUpdatePipeline('DENY', {
          operation,
          resource,
          message: `[SECURITY VIOLATION] Hot-path monitor BLOCKED ${operation}("${resource}")! Access denied by capability scope.`,
        });
      }

      setTimeout(() => {
        handleUpdatePipeline('DS_FUSION', {
          message: `[DEMPSTER-SHAFER FUSION] Fused sensor mass: m(U)=${((result?.untrustworthy || 0) * 100).toFixed(1)}%, Conflict K=${(result?.conflict || 0).toFixed(3)}. Consensus updated.`,
        });
      }, 500);

      setTimeout(() => {
        handleUpdatePipeline('POLICY_ENGINE', {
          message:
            result.security_state === 'RESTRICTED'
              ? '[DYNAMIC REVOCATION] Threshold exceeded! Policy Engine transitioned state to RESTRICTED. WRITE_FILE revoked in real time!'
              : result.security_state === 'CRITICAL'
              ? '[CRITICAL CONTAINMENT] Multi-violation detected! Zero-trust container lockdown activated!'
              : '[POLICY STATUS] Adaptive policy verified state remains NORMAL. Scoped execution intact.',
        });
      }, 1100);

      setTimeout(() => {
        handleUpdatePipeline('IDLE');
      }, 3500);

      const [capsData, trustData, historyData, eventsData, timelineData] =
        await Promise.allSettled([
          api.getCapabilities(task.task_id),
          api.getTrustState(task.task_id),
          api.getTrustHistory(task.task_id),
          api.getEvents(task.task_id),
          api.getTimeline(task.task_id),
        ]);

      if (capsData.status === 'fulfilled') setCapabilities(capsData.value || []);
      if (trustData.status === 'fulfilled' && trustData.value) setTrust(trustData.value);
      if (historyData.status === 'fulfilled' && Array.isArray(historyData.value)) {
        setTrustHistory(historyData.value);
      }
      if (eventsData.status === 'fulfilled') setEvents(eventsData.value || []);
      if (timelineData.status === 'fulfilled') setTimeline(timelineData.value || []);

      return result;
    } catch (err) {
      console.error('Simulation failed:', err);
      handleUpdatePipeline('IDLE');
      return null;
    }
  };

  const handleResetDemo = async () => {
    handleUpdatePipeline('IDLE', {
      message: 'Rebooting agent sandbox. Resetting capabilities to pristine least-privilege token.',
    });
    await handleCreateDemoTask();
  };

  const activeCapsCount = capabilities.filter((c) => c.status === 'ACTIVE').length;
  const revokedCaps = capabilities.filter((c) => c.status === 'REVOKED');

  return (
    <div className="command-stage flex flex-col space-y-4">
      <section className="dashboard-intro flex flex-col xl:flex-row xl:items-end justify-between gap-4 px-1 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
            <span className="h-px w-7 bg-cyan-400/70" /> System overview
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-[-0.045em] text-white">Security posture <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">at a glance.</span></h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">Monitor agent activity, permissions, and policy decisions from one place. Every event is recorded for review.</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 rounded-xl border border-white/[0.08] bg-slate-950/35 px-3.5 py-2.5">
          <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.85)]' : 'bg-amber-400'}`} />
          <span>{wsConnected ? 'Telemetry connected' : 'Connecting telemetry'}</span>
        </div>
      </section>
      {/* Sleek Sub-Header HUD Bar (Console Switcher & System Telemetry) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-0.5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Console Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-white/[0.08] shadow-inner">
            <button
              onClick={() => setActiveConsoleMode('chamber')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeConsoleMode === 'chamber'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Live Agent Sandbox</span>
            </button>
            <button
              onClick={() => setActiveConsoleMode('deck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeConsoleMode === 'deck'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Scenario Deck</span>
            </button>
          </div>

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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-[0_0_18px_rgba(168,85,247,0.4)] hover:scale-[1.03] cursor-pointer border border-white/20"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
            <span>Interactive Attack &amp; Event Injector</span>
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

      {/* ================= MASTER STICKY KERNEL DEFENSE PIPELINE FLOW (Visible even when scrolling down) ================= */}
      <StickyPipelineFlow
        activeStage={pipelineStage}
        stageDetail={stageDetail}
        securityState={securityState}
        trust={trust}
      />

      {/* Flagship Interactive Engine: Live Autonomous Agent Chamber OR Scenario Deck */}
      {activeConsoleMode === 'chamber' ? (
        <LiveAgentChamber
          task={task}
          capabilities={capabilities}
          onAssignPlannedTask={handleAssignPlannedTask}
          onSimulateOperation={handleSimulateAttack}
          onRunNormalTask={handleRunNormalTask}
          onResetDemo={handleResetDemo}
          onOpenEventInjector={() => setIsEventDrawerOpen(true)}
          securityState={securityState}
          trust={trust}
          activePipelineStage={pipelineStage}
          onUpdatePipeline={handleUpdatePipeline}
        />
      ) : (
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
      )}

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
                taskId={task?.task_id}
                onRefresh={() => task?.task_id && loadTaskSnapshot(task.task_id)}
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

      {/* Persistent Floating Trigger: Interactive Attack & Event Injector */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsEventDrawerOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-[0_6px_25px_rgba(168,85,247,0.55)] border border-white/25 hover:scale-105 transition-all cursor-pointer backdrop-blur-md group"
          title="Open the Interactive Attack & Event Injector console"
        >
          <Radio className="w-4 h-4 text-cyan-200 animate-pulse group-hover:rotate-12 transition-transform" />
          <span>⚡ Attack &amp; Event Injector</span>
        </button>
      </div>
    </div>
  );
}

