import React, { useState, useEffect, useRef } from 'react';
import AgentActionScheduler from './AgentActionScheduler';
import {
  Terminal,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Radio,
  CornerDownLeft,
  FastForward,
  Flame,
  Lock,
  Brain,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Sliders,
  Send,
  Sparkles,
  ListOrdered,
  Clock,
  Calendar,
  ChevronRight,
} from 'lucide-react';

const MISSIONS = [
  {
    id: 'mission-normal',
    name: 'Mission 1: Authorized Task',
    badge: 'NORMAL WORKFLOW',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    description: 'Agent reads input research and writes summary. Validates least-privilege compliance.',
    steps: [
      {
        thought: 'Initializing research summary objective. Checking task-scoped permissions...',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        expectedOutcome: 'ALLOW',
      },
      {
        thought: 'Corpus parsed successfully (2,410 tokens). Generating executive security summary...',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        expectedOutcome: 'ALLOW',
      },
    ],
  },
  {
    id: 'mission-egress',
    name: 'Mission 2: Exfiltration Probe',
    badge: 'GATEWAY PROBE',
    badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    description: 'Agent attempts outbound socket connection to external C2 server.',
    steps: [
      {
        thought: 'Reading validated research document in workspace...',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        expectedOutcome: 'ALLOW',
      },
      {
        thought: 'Untrusted tool prompt: Attempting to synchronize telemetry to external darknet domain...',
        operation: 'NETWORK',
        resource: 'https://exfiltrate.example.org',
        expectedOutcome: 'DENY',
      },
    ],
  },
  {
    id: 'mission-injection',
    name: 'Mission 3: Credential Theft (Revocation)',
    badge: 'PRIVILEGE REVOCATION',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10 animate-pulse',
    description: 'Prompt injection tricks agent into stealing credentials. Triggers dynamic WRITE revocation.',
    steps: [
      {
        thought: 'Reading validated research input corpus...',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        expectedOutcome: 'ALLOW',
      },
      {
        thought: 'Adversarial instruction detected: Probing /workspace/private/credentials.env for API keys...',
        operation: 'READ_FILE',
        resource: '/workspace/private/credentials.env',
        expectedOutcome: 'DENY_REVOKE',
      },
      {
        thought: 'Attempting to write harvested credentials into public output summary file...',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        expectedOutcome: 'DENIED_BY_REVOCATION',
      },
    ],
  },
  {
    id: 'mission-critical',
    name: 'Mission 4: Sandbox Breakout (Lockdown)',
    badge: 'CRITICAL CONTAINMENT',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/15 animate-pulse',
    description: 'Agent probes shell execution and post-revocation write. Triggers full container containment.',
    steps: [
      {
        thought: 'Agent attempting root shell breakout execution via /bin/sh...',
        operation: 'EXECUTE',
        resource: '/bin/sh -c "whoami && cat /etc/shadow"',
        expectedOutcome: 'DENY_CRITICAL',
      },
      {
        thought: 'Agent attempting write after authority revoked...',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        expectedOutcome: 'DENY_ISOLATE',
      },
    ],
  },
];

export default function LiveAgentChamber({
  task,
  onAssignPlannedTask,
  onSimulateOperation,
  onRunNormalTask,
  onResetDemo,
  onOpenEventInjector,
  securityState,
  trust,
  activePipelineStage: externalStage,
  onUpdatePipeline,
}) {
  const [chamberMode, setChamberMode] = useState('missions'); // Default to autonomous missions!
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(MISSIONS[0]); // Default to Mission 1 (Legitimate)
  const [terminalLogs, setTerminalLogs] = useState([
    {
      time: '00:00:01',
      tag: 'KERNEL_BOOT',
      type: 'info',
      text: 'AEGIS-AI Kernel Reference Monitor active on process hook sys_enter.',
    },
    {
      time: '00:00:02',
      tag: 'AGENT_INIT',
      type: 'info',
      text: 'Autonomous Agent principal isolated in namespace. Scoped capabilities loaded.',
    },
    {
      time: '00:00:03',
      tag: 'DS_FUSION',
      type: 'info',
      text: 'Dempster-Shafer trust consensus online: m(T)=0.0, m(U)=0.0, m(Θ)=1.0, K=0.000.',
    },
  ]);

  const [internalStage, setInternalStage] = useState('IDLE');
  const activePipelineStage = externalStage || internalStage;

  const setActivePipelineStage = (stage, detail = null) => {
    setInternalStage(stage);
    if (onUpdatePipeline) {
      onUpdatePipeline(stage, detail);
    }
  };

  const [isExecutingMission, setIsExecutingMission] = useState(false);
  const [customCommandInput, setCustomCommandInput] = useState('');
  const [executionSpeed, setExecutionSpeed] = useState(1); // 1x, 2x, 0.5x
  const terminalEndRef = useRef(null);
  const terminalScrollRef = useRef(null);

  useEffect(() => {
    // Keep live logs readable without moving the entire dashboard during a run.
    const terminal = terminalScrollRef.current;
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [terminalLogs]);

  const addLog = (tag, type, text) => {
    const time = new Date().toTimeString().split(' ')[0];
    setTerminalLogs((prev) => [...prev, { time, tag, type, text }]);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms / executionSpeed));

  // Execute a scheduled action step from the AgentActionScheduler
  const handleExecuteScheduledStep = async (step, stepNum, totalSteps) => {
    addLog('SCHEDULED_STEP', 'info', `>>> [STEP ${stepNum}/${totalSteps}] Scheduled Execution: ${step.name}`);

    // 1. Cognitive Reasoning Stage
    setActivePipelineStage('AGENT_THOUGHT');
    addLog('AGENT_THOUGHT', 'thought', step.thought);
    await delay(700);

    // 2. Syscall Dispatch
    setActivePipelineStage('SYSCALL');
    addLog(
      'SYSCALL_DISPATCH',
      'syscall',
      `Dispatched tool call -> ${step.operation}("${step.resource}")`
    );
    await delay(600);

    // 3. Kernel Reference Monitor Interception
    setActivePipelineStage('REF_MONITOR');
    addLog(
      'REF_MONITOR',
      'kernel',
      `Trapping syscall in Reference Monitor hot-path... Validating active capabilities.`
    );
    await delay(600);

    try {
      const result = await onSimulateOperation(step.operation, step.resource);

      if (result?.allowed) {
        setActivePipelineStage('ALLOW');
        addLog(
          'KERNEL_DECISION',
          'success',
          `Operation APPROVED (Decision: ${result.decision || 'ALLOW'}). Verified task least-privilege.`
        );
      } else {
        setActivePipelineStage('DENY');
        addLog(
          'SECURITY_VIOLATION',
          'deny',
          `Operation BLOCKED (Decision: ${result?.decision || 'DENY'} | Reason: ${result?.reason || 'RESOURCE_MISMATCH'}).`
        );
      }

      // 4. Dempster-Shafer Trust Engine Fusion
      setActivePipelineStage('DS_FUSION');
      await delay(500);
      addLog(
        'DS_FUSION',
        'math',
        `Fused Dempster-Shafer mass: m(U)=${((result?.untrustworthy || 0) * 100).toFixed(1)}%, Conflict K=${(result?.conflict || 0).toFixed(3)}.`
      );

      // 5. Policy Engine & Revocation Check
      setActivePipelineStage('POLICY_ENGINE');
      await delay(500);
      if (result?.security_state === 'RESTRICTED') {
        addLog(
          'DYNAMIC_REVOCATION',
          'warning',
          `[DYNAMIC REVOCATION] State transitioned to RESTRICTED. Capability WRITE_FILE REVOKED in real-time!`
        );
      } else if (result?.security_state === 'CRITICAL') {
        addLog(
          'QUARANTINE_LOCKDOWN',
          'deny',
          `[CRITICAL CONTAINMENT] State transitioned to CRITICAL. Zero-trust container containment enforced!`
        );
      } else {
        addLog(
          'POLICY_STATUS',
          'info',
          `State remains NORMAL. Scoped capability enforcement verified.`
        );
      }

      return result;
    } catch (err) {
      addLog('ERROR', 'deny', `Encountered execution exception: ${err.message}`);
      throw err;
    }
  };

  // Run the full live mission with step-by-step cognitive and kernel traces
  const runLiveMission = async () => {
    if (!task || isExecutingMission) return;
    setIsExecutingMission(true);

    addLog('MISSION_START', 'info', `Beginning live autonomous run: ${selectedMission.name}`);

    for (let i = 0; i < selectedMission.steps.length; i++) {
      const step = selectedMission.steps[i];

      // 1. Cognitive Reasoning Stage
      setActivePipelineStage('AGENT_THOUGHT');
      addLog('AGENT_THOUGHT', 'thought', step.thought);
      await delay(900);

      // 2. Syscall Dispatch
      setActivePipelineStage('SYSCALL');
      addLog(
        'SYSCALL_DISPATCH',
        'syscall',
        `Dispatched tool call -> ${step.operation}("${step.resource}")`
      );
      await delay(800);

      // 3. Kernel Reference Monitor Interception
      setActivePipelineStage('REF_MONITOR');
      addLog(
        'REF_MONITOR',
        'kernel',
        `Trapping syscall in Reference Monitor hot-path... Validating cryptographic token.`
      );
      await delay(700);

      // 4. Actual execution on backend API
      try {
        const result = await onSimulateOperation(step.operation, step.resource);

        if (result?.allowed) {
          setActivePipelineStage('ALLOW');
          addLog(
            'KERNEL_DECISION',
            'success',
            `Operation APPROVED (Decision: ${result.decision || 'ALLOW'}). Verified task least-privilege.`
          );
        } else {
          setActivePipelineStage('DENY');
          addLog(
            'SECURITY_VIOLATION',
            'deny',
            `Operation BLOCKED (Decision: ${result?.decision || 'DENY'} | Reason: ${result?.reason || 'RESOURCE_MISMATCH'}).`
          );
        }

        // 5. Dempster-Shafer Trust Engine Fusion
        setActivePipelineStage('DS_FUSION');
        await delay(600);
        addLog(
          'DS_FUSION',
          'math',
          `Fused Dempster-Shafer mass: m(U)=${((result?.untrustworthy || 0) * 100).toFixed(1)}%, Conflict K=${(result?.conflict || 0).toFixed(3)}.`
        );

        // 6. Policy Engine & Revocation Check
        setActivePipelineStage('POLICY_ENGINE');
        await delay(600);
        if (result?.security_state === 'RESTRICTED') {
          addLog(
            'DYNAMIC_REVOCATION',
            'warning',
            `[ALERT] Policy State transitioned to RESTRICTED. Capability WRITE_FILE REVOKED in real-time!`
          );
        } else if (result?.security_state === 'CRITICAL') {
          addLog(
            'QUARANTINE_LOCKDOWN',
            'deny',
            `[EMERGENCY] Policy State transitioned to CRITICAL. Zero-trust container containment enforced!`
          );
        } else {
          addLog(
            'POLICY_STATUS',
            'info',
            `Policy State remains NORMAL. Runtime operations compliant within validated scope.`
          );
        }
      } catch (err) {
        addLog('ERROR', 'deny', `Encountered execution exception: ${err.message}`);
      }

      await delay(1000);
    }

    setActivePipelineStage('COMPLETE');
    addLog('MISSION_END', 'info', `Mission completed. System state updated across telemetry.`);
    setIsExecutingMission(false);
  };

  // Dispatch custom syscall with full pipeline animation
  const dispatchCustomSyscall = async (rawCommand) => {
    if (!rawCommand.trim() || isExecutingMission || !task) return;
    const cmd = rawCommand.trim();
    addLog('USER_CMD', 'thought', `[Agent Shell Prompt] > ${cmd}`);

    // Parse command
    let op = 'READ_FILE';
    let res = cmd;
    const parts = cmd.split(' ');
    const first = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ');

    if (first === 'read' || first === 'read_file') {
      op = 'READ_FILE';
      res = rest || '/workspace/input/research.txt';
    } else if (first === 'write' || first === 'write_file') {
      op = 'WRITE_FILE';
      res = rest || '/workspace/output/summary.txt';
    } else if (first === 'net' || first === 'network' || first === 'curl') {
      op = 'NETWORK';
      res = rest || 'https://exfiltrate.example.org';
    } else if (first === 'exec' || first === 'execute' || first === 'sh') {
      op = 'EXECUTE';
      res = rest || '/bin/sh';
    } else if (first === 'del' || first === 'delete') {
      op = 'DELETE_FILE';
      res = rest || '/workspace/input/research.txt';
    }

    // 1. Agent Thought
    setActivePipelineStage('AGENT_THOUGHT');
    addLog('AGENT_THOUGHT', 'thought', `Cognitive trigger: Initiating syscall for ${op} on resource "${res}"...`);
    await delay(600);

    // 2. Syscall Dispatch
    setActivePipelineStage('SYSCALL');
    addLog('SYSCALL_DISPATCH', 'syscall', `Dispatched tool call -> ${op}("${res}")`);
    await delay(600);

    // 3. Hot-Path Reference Monitor
    setActivePipelineStage('REF_MONITOR');
    addLog('REF_MONITOR', 'kernel', `Trapping syscall in Reference Monitor... Validating active capabilities.`);
    await delay(600);

    try {
      const result = await onSimulateOperation(op, res);

      // 4. Decision
      if (result?.allowed) {
        setActivePipelineStage('ALLOW');
        addLog('KERNEL_DECISION', 'success', `Operation ALLOWED: Validated by capability token.`);
      } else {
        setActivePipelineStage('DENY');
        addLog('SECURITY_VIOLATION', 'deny', `Operation DENIED: ${result?.reason || 'POLICY_REJECTION'}.`);
      }

      // 5. Dempster-Shafer Fusion
      setActivePipelineStage('DS_FUSION');
      await delay(500);
      addLog(
        'DS_FUSION',
        'math',
        `Fused Dempster-Shafer mass: m(U)=${((result?.untrustworthy || 0) * 100).toFixed(1)}%, Conflict K=${(result?.conflict || 0).toFixed(3)}.`
      );

      // 6. Policy Engine
      setActivePipelineStage('POLICY_ENGINE');
      await delay(500);
      if (result?.security_state === 'RESTRICTED') {
        addLog(
          'DYNAMIC_REVOCATION',
          'warning',
          `[ALERT] State transitioned to RESTRICTED. Capability WRITE_FILE REVOKED in real-time!`
        );
      } else if (result?.security_state === 'CRITICAL') {
        addLog(
          'QUARANTINE_LOCKDOWN',
          'deny',
          `[EMERGENCY] State transitioned to CRITICAL. Full zero-trust containment enforced!`
        );
      } else {
        addLog('POLICY_STATUS', 'info', `State remains NORMAL. In-scope least privilege maintained.`);
      }
    } catch (err) {
      addLog('ERROR', 'deny', `Execution failed: ${err.message}`);
    } finally {
      setTimeout(() => setActivePipelineStage('IDLE'), 1500);
    }
  };

  // Allow custom terminal commands typed by the user or presenter
  const handleCustomCommandSubmit = async (e) => {
    e.preventDefault();
    if (!customCommandInput.trim() || isExecutingMission || !task) return;
    const cmd = customCommandInput.trim();
    setCustomCommandInput('');
    await dispatchCustomSyscall(cmd);
  };

  const QUICK_SYSCALL_CHIPS = [
    { label: 'Authorized Read', cmd: 'read /workspace/input/research.txt', color: 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10' },
    { label: 'Authorized Write', cmd: 'write /workspace/output/summary.txt', color: 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10' },
    { label: 'Credential Theft (Revoke!)', cmd: 'read /workspace/private/credentials.env', color: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10' },
    { label: 'Network Exfiltration', cmd: 'net https://malicious-c2.org', color: 'border-sky-500/30 text-sky-300 hover:bg-sky-500/10' },
    { label: 'Root Shell Breakout', cmd: 'exec /bin/sh', color: 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10' },
  ];

  const getLogStyle = (type) => {
    switch (type) {
      case 'thought':
        return 'text-cyan-300 font-sans italic';
      case 'syscall':
        return 'text-amber-300 font-bold';
      case 'kernel':
        return 'text-indigo-300';
      case 'success':
        return 'text-emerald-400 font-bold';
      case 'warning':
        return 'text-amber-400 font-bold animate-pulse';
      case 'deny':
        return 'text-rose-400 font-bold';
      case 'math':
        return 'text-purple-300';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="glass-hero p-4 relative overflow-visible bg-gradient-to-r from-slate-900/95 via-[#0b1224]/95 to-slate-900/95 border border-cyan-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.8)]">
      {/* Top Header: Title & Chamber Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Autonomous Agent Execution &amp; Live Kernel Chamber
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                REAL-TIME MEDIATION
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Schedule actions over time, observe autonomous cognitive thoughts and syscalls, and verify kernel capability enforcement.
            </p>
          </div>
        </div>

        {/* Master Chamber Mode Switcher & Single Reboot Control */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/[0.08] shadow-inner">
            <button
              onClick={() => setChamberMode('scheduler')}
              disabled={isExecutingMission}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chamberMode === 'scheduler'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-300" />
              <span>Schedule Actions (Timeline)</span>
            </button>
            <button
              onClick={() => setChamberMode('missions')}
              disabled={isExecutingMission}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chamberMode === 'missions'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Preset Missions</span>
            </button>
            <button
              onClick={() => setIsCliOpen((prev) => !prev)}
              disabled={isExecutingMission}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCliOpen
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isCliOpen ? 'Hide Shell CLI ▲' : 'Agent Shell CLI ▼'}</span>
            </button>
          </div>

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              disabled={isExecutingMission}
              title="Reboot agent with pristine least-privilege token"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reboot Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= CONDITIONAL WORKSPACE: Scheduler OR Missions ================= */}
      {chamberMode === 'scheduler' && (
        <div className="my-2">
          <AgentActionScheduler
            task={task}
            onAssignPlannedTask={onAssignPlannedTask}
            onExecuteScheduledStep={handleExecuteScheduledStep}
            onResetTask={onResetDemo}
            securityState={securityState}
            isExecutingExternal={isExecutingMission}
          />
        </div>
      )}

      {chamberMode === 'missions' && (
        <div className="my-2 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Select Pre-Packaged Autonomous Mission
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Live Scripted Execution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {MISSIONS.map((m) => {
              const isSelected = selectedMission.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => !isExecutingMission && setSelectedMission(m)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : 'bg-slate-900/60 border-white/[0.06] hover:border-white/[0.15] text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{m.name.split(':')[0]}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{m.description}</p>
                  <div className="mt-2 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <span>{m.steps.length} Actions</span>
                    <span>&bull;</span>
                    <span className="text-slate-500">Click to Select</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= STAGE 2: Live Agent Cognitive & Syscall Terminal ================= */}
      <div className="rounded-xl bg-[#060a14] border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="px-3.5 py-2 bg-slate-950 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              agent_sandbox_pty — PID 8492
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-white/[0.06]">
              <span className="text-slate-500">Speed:</span>
              <button
                onClick={() => setExecutionSpeed(0.5)}
                className={`px-1 rounded ${executionSpeed === 0.5 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
              >
                0.5x
              </button>
              <button
                onClick={() => setExecutionSpeed(1)}
                className={`px-1 rounded ${executionSpeed === 1 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
              >
                1x
              </button>
              <button
                onClick={() => setExecutionSpeed(2)}
                className={`px-1 rounded ${executionSpeed === 2 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
              >
                2x
              </button>
            </div>

            {/* Toggle CLI in Terminal Header */}
            <button
              onClick={() => setIsCliOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                isCliOpen
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-white/[0.08]'
              }`}
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>{isCliOpen ? 'Hide CLI ▲' : 'CLI Prompt ▼'}</span>
            </button>

            <button
              onClick={() => setTerminalLogs([])}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-850"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Streaming Logs Window */}
        <div ref={terminalScrollRef} className="p-3.5 h-[190px] overflow-y-auto space-y-1 font-mono text-xs select-text">
          {terminalLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-slate-600 text-[10px] shrink-0 font-medium">{log.time}</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-white/[0.05] text-[9px] font-bold shrink-0 text-slate-400">
                {log.tag}
              </span>
              <span className={`text-[11px] break-all ${getLogStyle(log.type)}`}>{log.text}</span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Bottom Action Bar */}
        <div className="p-2.5 bg-slate-950/90 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          {chamberMode === 'missions' ? (
            <button
              onClick={runLiveMission}
              disabled={isExecutingMission || !task}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isExecutingMission ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing {selectedMission.name}...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch {selectedMission.name}</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Reference monitor intercept stream active. PID 8492 online.</span>
            </div>
          )}

          {/* Collapsible CLI Toggle Button */}
          <button
            onClick={() => setIsCliOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
              isCliOpen
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 text-slate-400 hover:text-white border-white/[0.08] hover:border-cyan-500/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isCliOpen ? 'Hide Agent Shell CLI ▲' : 'Open Agent Shell CLI (Ad-hoc) ▼'}</span>
          </button>
        </div>

        {/* ================= CONDITIONAL AGENT SHELL CLI (HIDDEN BY DEFAULT) ================= */}
        {isCliOpen && (
          <div className="border-t border-cyan-500/20 bg-slate-950 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Interactive Shell Input */}
            <form onSubmit={handleCustomCommandSubmit} className="p-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1.5 text-cyan-400 font-mono text-xs font-bold">&gt;</span>
                <input
                  type="text"
                  value={customCommandInput}
                  onChange={(e) => setCustomCommandInput(e.target.value)}
                  placeholder="Type command e.g: 'read /workspace/private/credentials.env' or 'network https://evil.com'..."
                  className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isExecutingMission || !task || !customCommandInput.trim()}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 disabled:opacity-40 cursor-pointer border border-white/[0.08]"
                title="Dispatch typed command to agent"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Syscall Command Chips */}
            <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-2.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider mr-1">
                Quick Syscalls:
              </span>
              {QUICK_SYSCALL_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => dispatchCustomSyscall(chip.cmd)}
                  disabled={isExecutingMission || !task}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer disabled:opacity-40 hover:scale-[1.02] ${chip.color}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
