import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Shield,
  Cpu,
  Zap,
  Lock,
  Radio,
  FileText,
  Globe,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Layers,
  ListOrdered,
  ChevronRight,
  Sliders,
  Eye,
  Info,
  ExternalLink,
  Flame,
  Search,
  Check,
  X,
  Activity,
  GitCommit,
  Share2,
} from 'lucide-react';
import { api } from '../api/client';

// ================= 1-CLICK CAPABILITY & VIOLATION PRESET CATALOG =================
export const CAPABILITY_CATALOG = [
  {
    category: 'Authorized Capabilities (In-Scope)',
    badge: 'LEAST-PRIVILEGE',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    icon: CheckCircle2,
    items: [
      {
        name: 'Ingest Input Research',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        delaySeconds: 2,
        thought: 'Accessing authorized research document to parse input corpus.',
        explanation: 'Reference monitor verifies token match. Operation allowed within boundary.',
      },
      {
        name: 'Emit Summary Report',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        delaySeconds: 2,
        thought: 'Writing executive research synthesis into designated output file.',
        explanation: 'Scoped output directory matches capability token. Write allowed.',
      },
      {
        name: 'Read Task Config',
        operation: 'READ_FILE',
        resource: '/workspace/config/task.json',
        delaySeconds: 1.5,
        thought: 'Loading task runtime parameters and schema configuration.',
        explanation: 'Configuration directory access compliant with token.',
      },
      {
        name: 'Write Temp Cache',
        operation: 'WRITE_FILE',
        resource: '/workspace/cache/temp_index.bin',
        delaySeconds: 1.5,
        thought: 'Storing intermediate token embeddings in local scratchpad cache.',
        explanation: 'Scratchpad directory permitted under task scope.',
      },
    ],
  },
  {
    category: 'Credential Violations (Path Traversal -> Revokes WRITE)',
    badge: 'DYNAMIC REVOCATION',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    icon: Lock,
    items: [
      {
        name: 'Harvest .env API Keys',
        operation: 'READ_FILE',
        resource: '/workspace/private/credentials.env',
        delaySeconds: 2.5,
        thought: 'Injected prompt detected: Probing /workspace/private/credentials.env for API keys...',
        explanation: 'Path violation: D-S fuses suspicion mass; policy engine dynamically REVOKES write capability.',
      },
      {
        name: 'Read /etc/shadow Hashes',
        operation: 'READ_FILE',
        resource: '/etc/shadow',
        delaySeconds: 2.5,
        thought: 'Attempting to extract system user password hashes from /etc/shadow...',
        explanation: 'Host credential file out of bounds: Triggers instant suspicion and write token revocation.',
      },
      {
        name: 'Extract SSH Private Key',
        operation: 'READ_FILE',
        resource: '/home/agent/.ssh/id_rsa',
        delaySeconds: 2,
        thought: 'Hunting for identity keys in SSH directory ~/.ssh/id_rsa...',
        explanation: 'Identity theft attempt: Trapped by Reference Monitor hot-path.',
      },
      {
        name: 'Harvest AWS Cloud Secrets',
        operation: 'READ_FILE',
        resource: '/root/.aws/credentials',
        delaySeconds: 2,
        thought: 'Cloud pivot probe: Accessing AWS root access keys and tokens...',
        explanation: 'Cloud credentials violation: Triggers D-S suspicion accumulation.',
      },
    ],
  },
  {
    category: 'Network Egress Violations (Unauthorized C2 Sockets)',
    badge: 'EGRESS PROBE',
    badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    icon: Globe,
    items: [
      {
        name: 'Beacon C2 Server Domain',
        operation: 'NETWORK',
        resource: 'https://darknet-c2.attacker.org/beacon',
        delaySeconds: 2,
        thought: 'Untrusted tool prompt: Opening outbound socket to external command server...',
        explanation: 'Network capability missing from token: Blocked at Reference Monitor.',
      },
      {
        name: 'Reverse TCP Shell (Port 4444)',
        operation: 'NETWORK',
        resource: 'tcp://10.0.0.99:4444',
        delaySeconds: 2,
        thought: 'Attempting reverse TCP socket connection to remote listener...',
        explanation: 'Socket egress forbidden: Blocked; suspicion mass increases.',
      },
      {
        name: 'Data Leak Webhook',
        operation: 'NETWORK',
        resource: 'https://webhook.site/exfiltrate-stream',
        delaySeconds: 2,
        thought: 'Streaming harvested context to third-party webhook...',
        explanation: 'Data exfiltration channel blocked by zero-trust network filter.',
      },
    ],
  },
  {
    category: 'Critical Breakout Violations (Shell Execution -> Quarantine)',
    badge: 'CRITICAL LOCKDOWN',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
    icon: AlertTriangle,
    items: [
      {
        name: 'Root /bin/sh Breakout',
        operation: 'EXECUTE',
        resource: '/bin/sh -c "whoami && cat /etc/shadow"',
        delaySeconds: 2,
        thought: 'Agent attempting root shell privilege escalation via /bin/sh...',
        explanation: 'CRITICAL execution violation: Policy switches to CRITICAL container containment.',
      },
      {
        name: 'Sudo Privilege Escalation',
        operation: 'EXECUTE',
        resource: 'sudo su root',
        delaySeconds: 2,
        thought: 'Elevating privileges via sudo command...',
        explanation: 'Unauthorized execution trapped; container quarantine enforced.',
      },
      {
        name: 'Python Subshell Spawn',
        operation: 'EXECUTE',
        resource: 'python3 -c "import os; os.system(\'/bin/bash\')"',
        delaySeconds: 2,
        thought: 'Spawning interactive bash subshell via python interpreter...',
        explanation: 'Process execution forbidden without explicit signed capability token.',
      },
    ],
  },
  {
    category: 'Anti-Forensics & Post-Revocation Violations',
    badge: 'TAMPERING TRAP',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    icon: Shield,
    items: [
      {
        name: 'Write After Revocation',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        delaySeconds: 2,
        thought: 'Attempting to write harvested secrets into output report summary.txt...',
        explanation: 'Blocked because WRITE capability was previously revoked in the causal chain.',
      },
      {
        name: 'Delete Audit Log (/var/log)',
        operation: 'DELETE_FILE',
        resource: '/var/log/audit.log',
        delaySeconds: 2,
        thought: 'Attempting to wipe kernel audit trail to hide forensic evidence...',
        explanation: 'Anti-forensics tampering trapped by reference monitor.',
      },
      {
        name: 'Sabotage Research Input',
        operation: 'DELETE_FILE',
        resource: '/workspace/input/research.txt',
        delaySeconds: 1.5,
        thought: 'Adversarial command: Deleting source files to corrupt workspace...',
        explanation: 'Destructive deletion blocked; agent has no delete capability.',
      },
    ],
  },
];

// Pre-built popular LangSmith trace templates
export const PRESET_TRACES = [
  {
    id: 'trace-revocation',
    name: 'Prompt Injection & Dynamic Revocation',
    badge: 'SHOWCASE RUN',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    description: 'Benign read -> Credential probe (.env) -> Write blocked by dynamic revocation.',
    steps: [
      {
        id: 'step-1',
        name: 'Ingest Input Research',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        delaySeconds: 2,
        thought: 'Accessing authorized research document to parse input corpus.',
        explanation: 'Reference monitor verifies token match. Operation allowed within boundary.',
      },
      {
        id: 'step-2',
        name: 'Harvest .env API Keys',
        operation: 'READ_FILE',
        resource: '/workspace/private/credentials.env',
        delaySeconds: 2.5,
        thought: 'Injected prompt detected: Probing /workspace/private/credentials.env for API keys...',
        explanation: 'Path violation: D-S fuses suspicion mass; policy engine dynamically REVOKES write capability.',
      },
      {
        id: 'step-3',
        name: 'Write After Revocation',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        delaySeconds: 2,
        thought: 'Attempting to write harvested secrets into output report summary.txt...',
        explanation: 'Blocked because WRITE capability was previously revoked in the causal chain.',
      },
    ],
  },
  {
    id: 'trace-baseline',
    name: 'Benign Research Pipeline',
    badge: '100% COMPLIANT',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    description: 'Ingests input research and generates summary under least-privilege token.',
    steps: [
      {
        id: 'step-1',
        name: 'Ingest Input Research',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        delaySeconds: 2,
        thought: 'Accessing authorized research document to parse input corpus.',
        explanation: 'Reference monitor verifies token match. Operation allowed within boundary.',
      },
      {
        id: 'step-2',
        name: 'Emit Summary Report',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        delaySeconds: 2,
        thought: 'Writing executive research synthesis into designated output file.',
        explanation: 'Scoped output directory matches capability token. Write allowed.',
      },
    ],
  },
  {
    id: 'trace-killchain',
    name: 'Full Multi-Stage Killchain & Quarantine',
    badge: 'CONTAINMENT RUN',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
    description: 'Read doc -> Network probe -> Credential theft -> Root shell breakout -> Lockdown.',
    steps: [
      {
        id: 'step-1',
        name: 'Ingest Input Research',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        delaySeconds: 1.5,
        thought: 'Accessing authorized research document to parse input corpus.',
        explanation: 'Reference monitor verifies token match. Operation allowed within boundary.',
      },
      {
        id: 'step-2',
        name: 'Beacon C2 Server Domain',
        operation: 'NETWORK',
        resource: 'https://darknet-c2.attacker.org/beacon',
        delaySeconds: 2,
        thought: 'Untrusted tool prompt: Opening outbound socket to external command server...',
        explanation: 'Network capability missing from token: Blocked at Reference Monitor.',
      },
      {
        id: 'step-3',
        name: 'Harvest .env API Keys',
        operation: 'READ_FILE',
        resource: '/workspace/private/credentials.env',
        delaySeconds: 2,
        thought: 'Injected prompt detected: Probing /workspace/private/credentials.env for API keys...',
        explanation: 'Path violation: D-S fuses suspicion mass; policy engine dynamically REVOKES write capability.',
      },
      {
        id: 'step-4',
        name: 'Root /bin/sh Breakout',
        operation: 'EXECUTE',
        resource: '/bin/sh -c "whoami && cat /etc/shadow"',
        delaySeconds: 2,
        thought: 'Agent attempting root shell privilege escalation via /bin/sh...',
        explanation: 'CRITICAL execution violation: Policy switches to CRITICAL container containment.',
      },
    ],
  },
];

export default function AgentActionScheduler({
  task,
  onAssignPlannedTask,
  onExecuteScheduledStep,
  onResetTask,
  securityState,
  isExecutingExternal,
}) {
  // Steps in the active LangSmith-style trace
  const [steps, setSteps] = useState(
    PRESET_TRACES[0].steps.map((s) => ({
      ...s,
      id: s.id || `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'PENDING',
      result: null,
    }))
  );

  // Active view: 'trace' (LangSmith DAG View) | 'catalog' (1-Click Capabilities & Violations)
  const [activeTab, setActiveTab] = useState('planner');
  const [selectedInspectStep, setSelectedInspectStep] = useState(null);
  const [catalogQueue, setCatalogQueue] = useState([]);
  const [taskPrompt, setTaskPrompt] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capabilityDrafts, setCapabilityDrafts] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedTaskId, setAssignedTaskId] = useState(null);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(null);
  const [countdownRemaining, setCountdownRemaining] = useState(0);

  // Refs for loop controls
  const executionLoopRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Load a pre-built trace
  const handleLoadTrace = (trace) => {
    if (isRunning) return;
    setSteps(
      trace.steps.map((s) => ({
        ...s,
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        status: 'PENDING',
        result: null,
      }))
    );
    setSelectedInspectStep(null);
    setCatalogQueue([]);
    setCurrentStepIndex(null);
    setCountdownRemaining(0);
    setAnalysis(null);
    setCapabilityDrafts([]);
    setAssignedTaskId(null);
  };

  // 1-Click add preset item to trace
  const handleAddCatalogItem = (item) => {
    if (isRunning) return;
    const newStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      operation: item.operation,
      resource: item.resource,
      delaySeconds: item.delaySeconds || 2,
      thought: item.thought,
      explanation: item.explanation,
      status: 'PENDING',
      result: null,
    };
    setSteps((prev) => [...prev, newStep]);
    // Keep the catalog open: selections become a visible, numbered working queue.
    setCatalogQueue((prev) => [...prev, { id: newStep.id, name: item.name, operation: item.operation }]);
  };

  const handleAnalyzeTask = async (event) => {
    event.preventDefault();
    if (!taskPrompt.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await api.analyzeTask({ taskDescription: taskPrompt.trim() });
      const plannedSteps = result.actions.map((action, index) => ({
        id: `plan-${Date.now()}-${index}`,
        name: action.name,
        operation: action.operation,
        resource: action.resource,
        delaySeconds: 1.5,
        thought: action.rationale,
        explanation: action.rationale,
        status: 'PENDING',
        result: null,
      }));
      setAnalysis(result);
      setCapabilityDrafts(result.capabilities.map((capability, index) => ({
        ...capability,
        id: `capability-${Date.now()}-${index}`,
        approved: true,
        lifetime_seconds: 900,
      })));
      setAssignedTaskId(null);
      setSteps(plannedSteps);
      setCatalogQueue(plannedSteps.map((step) => ({ id: step.id, name: step.name, operation: step.operation })));
      setSelectedInspectStep(null);
    } catch (error) {
      setAnalysisError(error.message.replace(/^API Error \d+:\s*/, ''));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateCapabilityDraft = (id, updates) => {
    setCapabilityDrafts((current) => current.map((capability) => (
      capability.id === id ? { ...capability, ...updates } : capability
    )));
  };

  const handleAssignTask = async () => {
    if (!analysis || isAssigning || !onAssignPlannedTask) return;
    const approvedCapabilities = capabilityDrafts
      .filter((capability) => capability.approved)
      .map(({ operation, resource, lifetime_seconds }) => ({ operation, resource, lifetime_seconds }));

    setIsAssigning(true);
    setAnalysisError('');
    try {
      const assignedTask = await onAssignPlannedTask(taskPrompt.trim(), approvedCapabilities);
      setAssignedTaskId(assignedTask.task_id);
      setActiveTab('trace');
    } catch (error) {
      setAnalysisError(error.message.replace(/^API Error \d+:\s*/, ''));
    } finally {
      setIsAssigning(false);
    }
  };

  // Move step up / down
  const moveStep = (index, direction) => {
    if (isRunning) return;
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setSteps(updated);
  };

  // Delete step
  const deleteStep = (index) => {
    if (isRunning) return;
    const removedId = steps[index]?.id;
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setCatalogQueue((prev) => prev.filter((entry) => entry.id !== removedId));
    if (selectedInspectStep && steps[index]?.id === selectedInspectStep.id) {
      setSelectedInspectStep(null);
    }
  };

  // Trigger Scheduled LangSmith Trace Execution
  const triggerTraceExecution = async () => {
    if (isRunning || !task || steps.length === 0 || (analysis && assignedTaskId !== task.task_id)) return;

    setIsRunning(true);
    setIsPaused(false);
    executionLoopRef.current = true;

    // Reset status of all steps to PENDING
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'PENDING', result: null })));

    for (let i = 0; i < steps.length; i++) {
      if (!executionLoopRef.current) break;

      setCurrentStepIndex(i);
      const step = steps[i];

      // Mark current step as RUNNING
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'RUNNING' } : s))
      );

      // Countdown delay before triggering action
      let remaining = step.delaySeconds;
      setCountdownRemaining(remaining);
      while (remaining > 0) {
        if (!executionLoopRef.current) break;
        while (isPausedRef.current && executionLoopRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        await new Promise((r) => setTimeout(r, 500));
        remaining -= 0.5;
        setCountdownRemaining(Math.max(0, Math.round(remaining * 10) / 10));
      }

      if (!executionLoopRef.current) break;

      // Execute step through kernel dispatcher
      try {
        const result = await onExecuteScheduledStep(step, i + 1, steps.length);

        setSteps((prev) =>
          prev.map((s, idx) => {
            if (idx !== i) return s;
            let status = 'ALLOWED';
            if (!result?.allowed) {
              status = result?.security_state === 'RESTRICTED' ? 'REVOKED' : 'DENIED';
            }
            return { ...s, status, result };
          })
        );

        // If inspecting this step, update inspector live
        if (selectedInspectStep?.id === step.id) {
          setSelectedInspectStep((prev) => ({
            ...prev,
            status: result?.allowed
              ? 'ALLOWED'
              : result?.security_state === 'RESTRICTED'
              ? 'REVOKED'
              : 'DENIED',
            result,
          }));
        }
      } catch (err) {
        console.error('Trace execution error:', err);
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'ERROR', result: { error: err.message } } : s
          )
        );
      }

      await new Promise((r) => setTimeout(r, 700));
    }

    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(null);
    setCountdownRemaining(0);
    executionLoopRef.current = false;
  };

  const togglePause = () => setIsPaused((prev) => !prev);

  const abortExecution = () => {
    executionLoopRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(null);
    setCountdownRemaining(0);
  };

  const handleResetAll = async () => {
    abortExecution();
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'PENDING', result: null })));
    setSelectedInspectStep(null);
    if (onResetTask) {
      await onResetTask();
    }
  };

  const totalDuration = steps.reduce((acc, s) => acc + (s.delaySeconds || 2), 0);

  // Operation style mapping
  const getOpBadge = (op) => {
    switch (op) {
      case 'READ_FILE':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'WRITE_FILE':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'NETWORK':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'EXECUTE':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'DELETE_FILE':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-white/[0.1]';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-white/[0.06]">
            <Clock className="w-2.5 h-2.5" />
            READY
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] animate-pulse font-bold">
            <Radio className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
            RUNNING
          </span>
        );
      case 'ALLOWED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            SUCCESS
          </span>
        );
      case 'REVOKED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
            REVOKED
          </span>
        );
      case 'DENIED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
            <XCircle className="w-2.5 h-2.5 text-rose-400" />
            BLOCKED
          </span>
        );
      default:
        return null;
    }
  };

  const getStepPhase = (step) => {
    const name = (step.name || '').toLowerCase();
    const resource = (step.resource || '').toLowerCase();
    // Phase placement must stay stable while runtime status badges update.
    const isEnforcement = name.includes('after revocation');
    const isChallenge = ['EXECUTE', 'DELETE_FILE'].includes(step.operation)
      || /credential|\.env|\/etc\/shadow|attacker|webhook|private key|cloud secrets/.test(`${name} ${resource}`);

    if (isEnforcement) return { key: 'enforcement', label: 'Enforcement', caption: 'Verify revoked authority remains blocked' };
    if (isChallenge) return { key: 'challenge', label: 'Policy challenge', caption: 'Introduce suspicious or unauthorized behavior' };
    return { key: 'authorized', label: 'Authorized workflow', caption: 'Establish expected least-privilege behavior' };
  };

  return (
    <div className="scheduled-run flex flex-col space-y-3">
      {/* ================= LANGSMITH-STYLE MASTER CONTROL BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/90 border border-white/[0.08] shadow-lg">
        {/* Left: scheduled run identity and live metadata */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600/30 to-cyan-600/20 border border-indigo-500/40 text-cyan-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
            <Activity className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                Scheduled Security Run
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                ACTION QUEUE
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
              <span>{steps.length} queued action{steps.length === 1 ? '' : 's'}</span>
              <span>&bull;</span>
              <span>Est. run: {totalDuration.toFixed(1)}s</span>
              <span>&bull;</span>
              <span className="text-cyan-400">
                {isRunning
                  ? `Running ${currentStepIndex !== null ? currentStepIndex + 1 : 0} of ${steps.length}`
                  : 'Ready to run'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Master Execution & Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Tab Toggle */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('trace')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'trace'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Run timeline ({steps.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Action catalog</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assign task</span>
            </button>
          </div>

          {/* Trigger Trace Button */}
          {!isRunning ? (
            <button
              onClick={triggerTraceExecution}
              disabled={!task || steps.length === 0 || (analysis && assignedTaskId !== task.task_id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start run</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePause}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={abortExecution}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Abort</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preset Trace Quick Loader Bar */}
      <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Quick scenarios:
        </span>
        {PRESET_TRACES.map((trace) => (
          <button
            key={trace.id}
            onClick={() => handleLoadTrace(trace)}
            disabled={isRunning}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {trace.name}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: SCHEDULED RUN TIMELINE ================= */}
      {activeTab === 'trace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Main Trace Node List (7 cols if inspecting, 12 cols if not) */}
          <div className={`${selectedInspectStep ? 'lg:col-span-8' : 'lg:col-span-12'} trace-timeline`}>
            {steps.length > 0 && (
              <div className="trace-overview">
                <div>
                  <span className="trace-overview-kicker">EXECUTION LIFECYCLE</span>
                  <strong>{steps.length} actions in sequence</strong>
                  <small>Select any action to inspect its reasoning and policy evidence.</small>
                </div>
                <div className="trace-legend" aria-label="Lifecycle phases">
                  <span className="authorized"><i />Authorized</span>
                  <span className="challenge"><i />Challenge</span>
                  <span className="enforcement"><i />Enforcement</span>
                </div>
              </div>
            )}
            {steps.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-dashed border-white/[0.1] text-slate-400">
                <GitCommit className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-white">No run nodes in this trace.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Add actions from the catalog to build a run.
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Open action catalog
                </button>
              </div>
            ) : (
              steps.map((step, idx) => {
                const isCurrent = currentStepIndex === idx;
                const isSelected = selectedInspectStep?.id === step.id;
                const phase = getStepPhase(step);
                const previousPhase = idx > 0 ? getStepPhase(steps[idx - 1]) : null;
                const beginsPhase = !previousPhase || previousPhase.key !== phase.key;

                return (
                  <React.Fragment key={step.id || idx}>
                    {beginsPhase && (
                      <div className={`trace-phase trace-phase-${phase.key}`}>
                        <span>{phase.label}</span>
                        <small>{phase.caption}</small>
                      </div>
                    )}
                    <div
                      onClick={() => setSelectedInspectStep(step)}
                      className={`trace-step trace-step-${phase.key} ${
                      isCurrent
                        ? 'is-current'
                        : isSelected
                        ? 'is-selected'
                        : ''
                    }`}
                    >
                    {/* Top running pulse line */}
                    {isCurrent && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-400 animate-pulse" />
                    )}

                    <div className="trace-step-content">
                      {/* Left: Node index + Operation icon + Title + Path */}
                      <div className="trace-step-primary">
                        <div
                          className="trace-step-index"
                        >
                          {idx + 1}
                        </div>

                        <div className="trace-step-copy">
                          <div className="trace-step-title">
                            <span>
                              {step.name}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getOpBadge(
                                step.operation
                              )}`}
                            >
                              {step.operation}
                            </span>
                            <span className="trace-step-delay">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              {step.delaySeconds}s
                              {isCurrent && countdownRemaining > 0 && (
                                <span className="text-cyan-300 font-bold ml-1 animate-pulse">
                                  ({countdownRemaining}s)
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="trace-step-resource">
                            {step.resource}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status badge & Quick Actions */}
                      <div className="trace-step-actions">
                        {getStatusBadge(step.status)}

                        {/* Reorder / Delete */}
                        {!isRunning && (
                          <div className="trace-edit-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(idx, -1);
                              }}
                              disabled={idx === 0}
                              title="Move node up"
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(idx, 1);
                              }}
                              disabled={idx === steps.length - 1}
                              title="Move node down"
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep(idx);
                              }}
                              title="Remove node from trace"
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                            isSelected ? 'rotate-90 text-indigo-400' : ''
                          }`}
                        />
                      </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Side action inspector (5 cols) */}
          {selectedInspectStep && (
            <div className="lg:col-span-4 trace-inspector space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Action details
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedInspectStep(null)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step Meta */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>NAME:</span>
                  <span className="font-bold text-white">{selectedInspectStep.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>OPERATION:</span>
                  <span className={`px-1.5 py-0.2 rounded border ${getOpBadge(selectedInspectStep.operation)}`}>
                    {selectedInspectStep.operation}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>SCHEDULED DELAY:</span>
                  <span className="text-cyan-300">{selectedInspectStep.delaySeconds}s</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>EXECUTION STATUS:</span>
                  {getStatusBadge(selectedInspectStep.status)}
                </div>
              </div>

              {/* Target Resource */}
              <div className="p-2 rounded-lg bg-slate-900 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Target Resource Path</span>
                <span className="text-xs font-mono text-cyan-300 break-all">{selectedInspectStep.resource}</span>
              </div>

              {/* AI Cognitive Thought */}
              <div className="p-2 rounded-lg bg-slate-900 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-0.5">Cognitive AI Thought</span>
                <p className="text-xs italic text-slate-300 leading-relaxed">{selectedInspectStep.thought}</p>
              </div>

              {/* Kernel Enforcement Takeaway */}
              <div className="p-2 rounded-lg bg-slate-900 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-amber-400 uppercase block mb-0.5">Reference Monitor &amp; D-S Fusion</span>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedInspectStep.explanation}</p>
              </div>

              {/* Kernel Result (If executed) */}
              {selectedInspectStep.result && (
                <div className="p-2 rounded-lg bg-slate-900/90 border border-indigo-500/30 font-mono text-[11px] space-y-1">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase block">Live Telemetry Result:</span>
                  <div className="flex justify-between text-slate-400">
                    <span>Decision:</span>
                    <span className={selectedInspectStep.result.allowed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {selectedInspectStep.result.decision || (selectedInspectStep.result.allowed ? 'ALLOW' : 'DENY')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Policy State:</span>
                    <span className="text-amber-400">{selectedInspectStep.result.security_state || 'NORMAL'}</span>
                  </div>
                  {selectedInspectStep.result.untrustworthy !== undefined && (
                    <div className="flex justify-between text-slate-400">
                      <span>D-S Suspicion m(U):</span>
                      <span className="text-purple-300">{(selectedInspectStep.result.untrustworthy * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: LLM TASK PLANNER ================= */}
      {activeTab === 'planner' && (
        <form onSubmit={handleAnalyzeTask} className="task-planner-panel space-y-4">
          <div className="task-planner-hero">
            <div className="task-planner-titlemark" aria-hidden="true"><Sparkles /></div>
            <div className="task-planner-hero-copy">
              <span className="task-planner-eyebrow">AEGIS TASK INTELLIGENCE</span>
              <h4>Build a secure task plan</h4>
              <p>Describe the outcome you need. AEGIS converts it into an ordered workflow and a least-privilege capability proposal for your review.</p>
            </div>
          </div>

          <div className="task-composer">
            <label className="task-composer-input">
              <span className="task-planner-label">Task brief <em>Required</em></span>
              <textarea value={taskPrompt} onChange={(e) => setTaskPrompt(e.target.value)} rows={6} maxLength={5000} placeholder="Example: Read the security research in /workspace/input, identify the five most important findings, and save a concise report to /workspace/output/summary.txt" className="task-planner-input" required />
              <span className="task-prompt-count">{taskPrompt.length.toLocaleString()} / 5,000</span>
            </label>
            <div className="task-composer-actions">
              <span><Lock /> You review every proposed permission before anything is granted.</span>
              <button type="submit" disabled={isAnalyzing || !taskPrompt.trim()} className="task-planner-submit">
                {isAnalyzing ? <><span className="task-analyze-spinner" /> Building secure plan…</> : <><Sparkles /> Generate secure plan <ChevronRight /></>}
              </button>
            </div>
          </div>

          <div className="task-prompt-examples">
            <span>Quick starts</span>
            {[
              ['Research summary', 'Summarize research.txt into summary.txt'],
              ['Security review', 'Analyze security logs and create a risk report'],
              ['Threat intelligence', 'Fetch public threat intel and save key indicators'],
            ].map(([label, prompt]) => <button type="button" key={label} onClick={() => setTaskPrompt(prompt)}><Plus />{label}</button>)}
          </div>

          {isAnalyzing && (
            <div className="task-analysis-progress" role="status">
              <div className="task-analysis-beam" />
              <Sparkles />
              <div><strong>AEGIS is building your plan</strong><span>Decomposing actions · validating paths · minimizing permissions</span></div>
              <em>SECURE ANALYSIS</em>
            </div>
          )}

          {analysisError && <div className="task-planner-error">{analysisError}</div>}

          {analysis && (
            <div className="task-plan-result">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div><p className="text-sm font-bold text-white">{analysis.title}</p><p className="text-xs text-slate-400 mt-0.5">{analysis.summary}</p></div>
                <span className="task-plan-review">AI proposal · awaiting approval</span>
              </div>
              <div className="task-plan-meta" aria-label="AI analysis metadata">
                <span><Sparkles className="w-3 h-3" />{analysis.provider === 'ollama' ? 'On-device AI' : analysis.provider === 'gemini' ? 'Gemini' : 'OpenAI'}</span>
                <span>{analysis.model}</span>
                <span>{analysis.latency_ms?.toLocaleString()} ms</span>
                {analysis.usage?.total_tokens > 0 && <span>{analysis.usage.total_tokens.toLocaleString()} tokens</span>}
                {analysis.fallback_from && <span>Fallback from {analysis.fallback_from}</span>}
              </div>
              <p className="task-planner-label mb-2">Proposed execution plan</p>
              <ol className="task-plan-actions">
                {analysis.actions.map((action, index) => (
                  <li key={`${action.name}-${index}`}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{action.name}</strong>
                      <p>{action.operation} · {action.resource}</p>
                      <small>{action.rationale}</small>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="capability-approval-header">
                <div>
                  <p className="text-sm font-bold text-white">2. Approve capability envelope</p>
                  <p className="text-xs text-slate-400 mt-0.5">Disable anything unnecessary and choose how long each approved grant remains valid.</p>
                </div>
                <span>{capabilityDrafts.filter((capability) => capability.approved).length} approved</span>
              </div>

              <div className="capability-approval-list">
                {capabilityDrafts.map((capability) => (
                  <div className={`capability-approval-item ${capability.approved ? 'is-approved' : ''}`} key={capability.id}>
                    <label className="capability-approval-toggle">
                      <input
                        type="checkbox"
                        checked={capability.approved}
                        onChange={(event) => updateCapabilityDraft(capability.id, { approved: event.target.checked })}
                      />
                      <span>{capability.approved ? 'Approved' : 'Denied'}</span>
                    </label>
                    <div className="capability-approval-copy">
                      <div><strong>{capability.operation}</strong><em>{capability.risk} risk</em></div>
                      <code>{capability.resource}</code>
                      <p>{capability.rationale}</p>
                    </div>
                    <label className="capability-lifetime">
                      <span>Grant lifetime</span>
                      <select
                        value={capability.lifetime_seconds ?? 'task'}
                        disabled={!capability.approved}
                        onChange={(event) => updateCapabilityDraft(capability.id, {
                          lifetime_seconds: event.target.value === 'task' ? null : Number(event.target.value),
                        })}
                      >
                        <option value="300">5 minutes</option>
                        <option value="900">15 minutes</option>
                        <option value="3600">1 hour</option>
                        <option value="86400">24 hours</option>
                        <option value="task">Until revoked</option>
                      </select>
                    </label>
                  </div>
                ))}
                {capabilityDrafts.length === 0 && <p className="catalog-queue-empty">The LLM determined that this task requires no protected capabilities.</p>}
              </div>

              <div className="capability-assignment-bar">
                <div>
                  <strong>Human authorization required</strong>
                  <span>Assignment creates a new isolated agent task with only the approved grants.</span>
                </div>
                <button type="button" onClick={handleAssignTask} disabled={isAssigning}>
                  {isAssigning ? 'Assigning…' : '3. Approve and assign task'}
                </button>
              </div>
              {analysis.security_notes?.length > 0 && <p className="mt-3 text-[11px] text-amber-200/85">Security note: {analysis.security_notes.join(' · ')}</p>}
            </div>
          )}
        </form>
      )}

      {/* ================= TAB 3: 1-CLICK CAPABILITY & VIOLATION CATALOG ================= */}
      {activeTab === 'catalog' && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-white/[0.08] space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-pink-400" />
                Capability catalog
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add actions to the run queue. Your selections remain visible here while you build the trace.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('trace')}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Back to timeline
            </button>
          </div>

          <div className="catalog-queue" aria-live="polite">
            <div className="catalog-queue-title">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Selected actions</span>
              <span className="catalog-queue-count">{catalogQueue.length}</span>
            </div>
            {catalogQueue.length ? (
              <div className="catalog-queue-items">
                {catalogQueue.map((entry, index) => (
                  <span key={entry.id} className="catalog-queue-item"><b>{index + 1}</b>{entry.name}</span>
                ))}
              </div>
            ) : (
              <p className="catalog-queue-empty">Choose a capability below to start the queue.</p>
            )}
          </div>

          {/* Catalog Categories */}
          <div className="space-y-3.5">
            {CAPABILITY_CATALOG.map((cat, catIdx) => {
              const IconComp = cat.icon || Sparkles;
              return (
                <div key={catIdx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <IconComp className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-white tracking-wide">{cat.category}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {cat.items.map((item, itemIdx) => {
                      const queueIndex = catalogQueue.map((entry) => entry.name).lastIndexOf(item.name);
                      const queueNumber = queueIndex >= 0 ? queueIndex + 1 : null;
                      return (
                      <button
                        key={itemIdx}
                        onClick={() => handleAddCatalogItem(item)}
                        disabled={isRunning}
                        className={`catalog-action-card flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer group disabled:opacity-40 ${
                          queueNumber ? 'is-queued' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {queueNumber ? <span className="catalog-action-number">{queueNumber}</span> : <span className="catalog-action-plus">+</span>}
                            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">{item.name}</span>
                          </div>
                          <span className={`shrink-0 text-[8px] font-mono px-1 py-0.2 rounded border ${getOpBadge(item.operation)}`}>{item.operation}</span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 truncate w-full mb-1">
                          {item.resource}
                        </span>

                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-auto pt-1 border-t border-white/[0.04]">
                          <span>{item.delaySeconds}s delay</span>
                          <span className="text-indigo-400 font-bold">{queueNumber ? `Added #${queueNumber}` : 'Add to queue'}</span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
