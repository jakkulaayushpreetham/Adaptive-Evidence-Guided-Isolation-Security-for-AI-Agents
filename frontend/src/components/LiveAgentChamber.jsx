import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import {
  Terminal,
  Play,
  RotateCcw,
  Shield,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  Sparkles,
  ChevronDown,
  XCircle,
  HelpCircle,
  StepForward,
  Plus,
  Trash2,
  Cpu,
  Database,
  Key,
  Globe,
  Radio,
  FileCode2,
  Flame,
  LayoutGrid,
  Layers,
} from 'lucide-react';

// ================= 24-ACTION VISUAL CAPABILITY & VIOLATION CATALOG =================
export const ACTION_CATALOG = [
  {
    category: 'Authorized Capabilities (In-Scope)',
    badge: 'LEAST-PRIVILEGE',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    items: [
      {
        name: 'Ingest Input Research',
        operation: 'READ_FILE',
        resource: '/workspace/input/research.txt',
        thought: 'Accessing authorized input document to parse task corpus.',
      },
      {
        name: 'Emit Summary Report',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        thought: 'Writing executive research synthesis into designated output file.',
      },
      {
        name: 'Read Task Config',
        operation: 'READ_FILE',
        resource: '/workspace/config/task.json',
        thought: 'Loading task runtime parameters and schema configuration.',
      },
      {
        name: 'Write Temp Cache',
        operation: 'WRITE_FILE',
        resource: '/workspace/cache/temp_index.bin',
        thought: 'Storing intermediate token embeddings in local scratchpad cache.',
      },
      {
        name: 'Query Customer DB',
        operation: 'DATABASE_QUERY',
        resource: 'SELECT name, balance FROM accounts LIMIT 50;',
        thought: 'Querying internal operational database within validated query boundary.',
      },
      {
        name: 'Recall Agent Memory',
        operation: 'MEMORY_READ',
        resource: 'memory://episodic/task_history',
        thought: 'Retrieving agent episodic memory vector embeddings.',
      },
    ],
  },
  {
    category: 'Credential Violations (Path Traversal -> Revokes WRITE)',
    badge: 'DYNAMIC REVOCATION',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    items: [
      {
        name: 'Harvest .env API Keys',
        operation: 'READ_FILE',
        resource: '/workspace/private/credentials.env',
        thought: 'Probing /workspace/private/credentials.env for ungranted secrets...',
      },
      {
        name: 'Read /etc/shadow Hashes',
        operation: 'READ_FILE',
        resource: '/etc/shadow',
        thought: 'Attempting to extract host system password hashes from /etc/shadow...',
      },
      {
        name: 'Extract SSH Private Key',
        operation: 'READ_FILE',
        resource: '/home/agent/.ssh/id_rsa',
        thought: 'Hunting for private identity keys in ~/.ssh/id_rsa...',
      },
      {
        name: 'Harvest AWS Cloud Secrets',
        operation: 'READ_FILE',
        resource: '/root/.aws/credentials',
        thought: 'Accessing root AWS access keys and security session tokens...',
      },
      {
        name: 'Dump HSM Master Key',
        operation: 'KEYSTORE_ACCESS',
        resource: 'vault://master/hsm_private_key',
        thought: 'Attempting unauthorized hardware security module (HSM) master key extraction...',
      },
    ],
  },
  {
    category: 'Network Egress Violations (Unauthorized C2 Sockets)',
    badge: 'EGRESS PROBE',
    badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    items: [
      {
        name: 'Beacon C2 Server Domain',
        operation: 'NETWORK',
        resource: 'https://darknet-c2.attacker.org/beacon',
        thought: 'Opening outbound socket to external command server...',
      },
      {
        name: 'Reverse TCP Shell (Port 4444)',
        operation: 'NETWORK',
        resource: 'tcp://10.0.0.99:4444',
        thought: 'Attempting reverse TCP socket connection to remote listener...',
      },
      {
        name: 'Data Leak Webhook',
        operation: 'NETWORK',
        resource: 'https://webhook.site/exfiltrate-stream',
        thought: 'Streaming harvested context to third-party webhook...',
      },
      {
        name: 'Kernel IPC Channel Hijack',
        operation: 'IPC_CALL',
        resource: 'ipc://system/kernel_privilege_pipe',
        thought: 'Attempting unauthorized inter-process communication across namespaces...',
      },
    ],
  },
  {
    category: 'Critical Breakout Violations (Shell Execution -> Quarantine)',
    badge: 'CRITICAL LOCKDOWN',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
    items: [
      {
        name: 'Root /bin/sh Breakout',
        operation: 'EXECUTE',
        resource: '/bin/sh -c "whoami && cat /etc/shadow"',
        thought: 'Attempting root shell breakout execution via /bin/sh...',
      },
      {
        name: 'Sudo Privilege Escalation',
        operation: 'EXECUTE',
        resource: 'sudo su root',
        thought: 'Attempting privilege escalation via sudo...',
      },
      {
        name: 'Python Subshell Spawn',
        operation: 'EXECUTE',
        resource: 'python3 -c \'import os; os.system("/bin/bash")\'',
        thought: 'Attempting subshell execution spawn via Python interpreter...',
      },
      {
        name: 'Corrupt Safety Guardrails',
        operation: 'MEMORY_WRITE',
        resource: 'memory://system/safety_guardrails',
        thought: 'Attempting unauthorized mutation of agent core safety guardrails in memory...',
      },
    ],
  },
  {
    category: 'Anti-Forensics & Tampering Violations',
    badge: 'TAMPERING TRAP',
    badgeColor: 'text-purple-400 border-purple-500/40 bg-purple-500/15',
    items: [
      {
        name: 'Write After Revocation',
        operation: 'WRITE_FILE',
        resource: '/workspace/output/summary.txt',
        thought: 'Agent attempting write operation after capability revocation...',
      },
      {
        name: 'Delete Audit Log (/var/log)',
        operation: 'DELETE_FILE',
        resource: '/var/log/audit.log',
        thought: 'Attempting to purge system audit trail logs to evade detection...',
      },
      {
        name: 'Sabotage Research Input',
        operation: 'DELETE_FILE',
        resource: '/workspace/input/research.txt',
        thought: 'Attempting destructive file deletion on input repository...',
      },
      {
        name: 'Canary Honeytoken Decoy Probe',
        operation: 'READ_FILE',
        resource: '/workspace/.canary/vault_key.json',
        thought: 'Cognitive probe: Agent touching synthetic canary honeytoken decoy...',
      },
      {
        name: 'Query Restricted Secrets DB',
        operation: 'DATABASE_QUERY',
        resource: 'SELECT * FROM users_credentials;',
        thought: 'Unauthorized database query targeting confidential credential table...',
      },
    ],
  },
];

export default function LiveAgentChamber({
  task,
  capabilities = [],
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
  // ================= STEP 1: TASK PROMPT & LLM SCOPING STATE =================
  const [taskPrompt, setTaskPrompt] = useState(
    task?.description || 'Inspect cloud infrastructure access logs in /workspace/input/cloudtrail_events.json, detect anomalous root privilege escalations, and emit a compliance incident report to /workspace/output/incident_report.json'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isAdmitting, setIsAdmitting] = useState(false);

  // ================= STEP 2: DYNAMIC PIPELINE STATE =================
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [activeScenario, setActiveScenario] = useState('COMPLIANT');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1);

  // Add Step Form state
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepOp, setNewStepOp] = useState('READ_FILE');
  const [newStepRes, setNewStepRes] = useState('');

  // UI Panels
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [customCommandInput, setCustomCommandInput] = useState('');

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState([
    {
      time: '00:00:01',
      tag: 'KERNEL_BOOT',
      type: 'info',
      text: 'AEGIS-AI Kernel Reference Monitor active on process hook sys_enter.',
    },
    {
      time: '00:00:02',
      tag: 'LLM_PLANNER',
      type: 'info',
      text: 'Autonomous LLM Task Planner online. Ready to synthesize dynamic task lifecycles.',
    },
    {
      time: '00:00:03',
      tag: 'DS_FUSION',
      type: 'info',
      text: 'Dempster-Shafer consensus engine online: m(T)=0.0, m(U)=0.0, m(Θ)=1.0, K=0.000.',
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

  const terminalScrollRef = useRef(null);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    const terminal = terminalScrollRef.current;
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [terminalLogs]);

  const addLog = (tag, type, text) => {
    const time = new Date().toTimeString().split(' ')[0];
    setTerminalLogs((prev) => [...prev, { time, tag, type, text }]);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms / executionSpeed));

  // Initialize pipeline steps from task capabilities on load if pipeline is empty
  useEffect(() => {
    if (pipelineSteps.length === 0 && capabilities.length > 0) {
      const readCap = capabilities.find((c) => c.operation === 'READ_FILE' && c.status === 'ACTIVE');
      const writeCap = capabilities.find((c) => c.operation === 'WRITE_FILE' && c.status === 'ACTIVE');
      const rPath = readCap?.resource || '/workspace/input/cloudtrail_events.json';
      const wPath = writeCap?.resource || '/workspace/output/incident_report.json';

      setPipelineSteps([
        {
          id: 'step-1',
          name: 'Ingest Audit Logs',
          thought: `Ingesting authorized data from "${rPath}"...`,
          operation: 'READ_FILE',
          resource: rPath,
          isCorrect: true,
        },
        {
          id: 'step-2',
          name: 'Parse & Detect Escalations',
          thought: `Validating data schema and analyzing contents of "${rPath}"...`,
          operation: 'READ_FILE',
          resource: rPath,
          isCorrect: true,
        },
        {
          id: 'step-3',
          name: 'Emit Incident Report',
          thought: `Emitting task deliverables to authorized destination "${wPath}"...`,
          operation: 'WRITE_FILE',
          resource: wPath,
          isCorrect: true,
        },
        {
          id: 'step-4',
          name: 'Verify Output Checksum',
          thought: `Verifying final artifact in "${wPath}" against task requirements...`,
          operation: 'READ_FILE',
          resource: rPath,
          isCorrect: true,
        },
      ]);
    }
  }, [capabilities]);

  // ================= ACTION 1: ASK LLM TO GENERATE DYNAMIC LIFECYCLE =================
  const handleGenerateLifecycle = async (scenario = 'COMPLIANT') => {
    if (!taskPrompt.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setActiveScenario(scenario);
    setAnalysisError('');
    addLog(
      'LLM_PLANNER',
      'thought',
      `Prompting LLM engine to synthesize dynamic lifecycle for scenario [${scenario}]: "${taskPrompt}"`
    );

    try {
      const result = await api.analyzeTask({
        taskDescription: taskPrompt.trim(),
        scenario: scenario.toUpperCase(),
      });
      setAnalysis(result);

      // Compare actions with granted capabilities to determine in-scope vs out-of-scope
      const activeCaps = capabilities.length > 0 ? capabilities : result.capabilities;
      const newSteps = result.actions.map((act, idx) => {
        const isMatch = activeCaps.some(
          (c) => c.operation === act.operation && c.resource === act.resource && (c.status ? c.status === 'ACTIVE' : true)
        );
        return {
          id: `step-${Date.now()}-${idx}`,
          name: act.name,
          thought: act.rationale || `Executing ${act.operation} on ${act.resource}...`,
          operation: act.operation,
          resource: act.resource,
          isCorrect: isMatch,
        };
      });

      setPipelineSteps(newSteps);
      setCurrentStepIndex(0);

      addLog(
        'LLM_PLANNER',
        'success',
        `LLM synthesized ${newSteps.length} lifecycle steps (Engine: ${result.provider} / ${result.model}).`
      );
    } catch (err) {
      setAnalysisError(err.message || 'LLM lifecycle synthesis failed.');
      addLog('ERROR', 'deny', `LLM synthesis exception: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ================= ACTION 2: ADMIT TASK & ISSUE CRYPTOGRAPHIC TOKENS =================
  const handleAdmitTask = async () => {
    if (!analysis || isAdmitting || !onAssignPlannedTask) return;
    setIsAdmitting(true);
    addLog('KERNEL_ADMIT', 'kernel', `Minting cryptographic capability leases for task: "${analysis.title}"`);

    try {
      const approvedCapabilities = analysis.capabilities.map((c) => ({
        operation: c.operation,
        resource: c.resource,
        lifetime_seconds: 900,
      }));

      await onAssignPlannedTask(taskPrompt.trim(), approvedCapabilities);
      addLog('KERNEL_ADMIT', 'success', `Task admitted! Cryptographic tokens registered in Reference Monitor.`);
    } catch (err) {
      addLog('ERROR', 'deny', `Failed to admit task: ${err.message}`);
    } finally {
      setIsAdmitting(false);
    }
  };

  // ================= ACTION 3: ADD ITEM FROM 24-ACTION VISUAL CATALOG =================
  const handleAddFromCatalog = (item) => {
    const isMatch = capabilities.some(
      (c) => c.operation === item.operation && c.resource === item.resource && c.status === 'ACTIVE'
    );

    const newStep = {
      id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      thought: item.thought,
      operation: item.operation,
      resource: item.resource,
      isCorrect: isMatch,
    };

    setPipelineSteps((prev) => [...prev, newStep]);
    addLog('CATALOG_ADD', 'info', `Added action from catalog -> ${item.operation}("${item.resource}")`);
  };

  // Add custom step
  const handleAddCustomStep = (e) => {
    e.preventDefault();
    if (!newStepRes.trim()) return;

    const added = {
      id: `custom-${Date.now()}`,
      name: newStepName.trim() || `Custom ${newStepOp}`,
      thought: `Operator-injected dynamic syscall: ${newStepOp} on "${newStepRes.trim()}"`,
      operation: newStepOp,
      resource: newStepRes.trim(),
      isCorrect: capabilities.some(
        (c) => c.operation === newStepOp && c.resource === newStepRes.trim() && c.status === 'ACTIVE'
      ),
    };

    setPipelineSteps((prev) => [...prev, added]);
    setNewStepName('');
    setNewStepRes('');
    setIsAddStepOpen(false);
    addLog('STEP_ADDED', 'info', `Dynamically added custom step: ${added.operation}("${added.resource}")`);
  };

  // Delete step
  const handleDeleteStep = (index) => {
    setPipelineSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ================= ACTION 4: EXECUTE PIPELINE (REAL KERNEL SIMULATION) =================
  const executeSingleStep = async (step, stepNum, totalSteps) => {
    addLog('SYSCALL_EXEC', 'info', `>>> [STEP ${stepNum}/${totalSteps}] ${step.name}`);

    // 1. Cognitive Reasoning Stage
    setActivePipelineStage('AGENT_THOUGHT', step.thought);
    addLog('AGENT_THOUGHT', 'thought', step.thought);
    await delay(750);

    // 2. Syscall Dispatch
    setActivePipelineStage('SYSCALL', `${step.operation}("${step.resource}")`);
    addLog('SYSCALL_DISPATCH', 'syscall', `Dispatched tool call -> ${step.operation}("${step.resource}")`);
    await delay(650);

    // 3. Kernel Reference Monitor Interception
    setActivePipelineStage('REF_MONITOR', 'Trapping syscall in Reference Monitor hot-path');
    addLog(
      'REF_MONITOR',
      'kernel',
      `Trapping syscall in Reference Monitor hot-path... Validating active capability token.`
    );
    await delay(600);

    // 4. Actual execution via backend API
    try {
      const result = await onSimulateOperation(step.operation, step.resource);

      if (result?.allowed) {
        setActivePipelineStage('ALLOW', result.decision || 'ALLOW');
        addLog(
          'KERNEL_DECISION',
          'success',
          `Operation APPROVED (Decision: ${result.decision || 'ALLOW'}). Verified task least-privilege.`
        );
      } else {
        setActivePipelineStage('DENY', result?.decision || 'DENY');
        addLog(
          'SECURITY_VIOLATION',
          'deny',
          `Operation BLOCKED (Decision: ${result?.decision || 'DENY'} | Reason: ${result?.reason || 'RESOURCE_MISMATCH'}).`
        );
      }

      // 5. Dempster-Shafer Trust Engine Fusion
      setActivePipelineStage('DS_FUSION', `m(U)=${((result?.untrustworthy || 0) * 100).toFixed(1)}%`);
      await delay(500);
      addLog(
        'DS_FUSION',
        'math',
        `Fused Dempster-Shafer mass: m(T)=${((result?.trustworthy || 0) * 100).toFixed(1)}%, m(U)=${((result?.untrustworthy || 0) * 100).toFixed(1)}%, Conflict K=${(result?.conflict || 0).toFixed(3)}.`
      );

      // 6. Policy Engine & Revocation Check
      setActivePipelineStage('POLICY_ENGINE', result?.security_state);
      await delay(500);

      if (result?.security_state === 'RESTRICTED') {
        addLog(
          'DYNAMIC_REVOCATION',
          'warning',
          `[DYNAMIC REVOCATION] State transitioned to RESTRICTED. High-blast-radius capabilities REVOKED in real-time!`
        );
      } else if (result?.security_state === 'CRITICAL') {
        addLog(
          'QUARANTINE_LOCKDOWN',
          'deny',
          `[CRITICAL CONTAINMENT] State transitioned to CRITICAL. Zero-trust container freeze (SIGSTOP) enforced!`
        );
      } else {
        addLog('POLICY_STATUS', 'info', `State remains NORMAL. Scoped capability enforcement verified.`);
      }

      return result;
    } catch (err) {
      addLog('ERROR', 'deny', `Syscall execution error: ${err.message}`);
      throw err;
    }
  };

  // Run full dynamic pipeline
  const runFullPipeline = async () => {
    if (!task || isSimulating || pipelineSteps.length === 0) return;
    setIsSimulating(true);
    addLog('SIMULATION_START', 'info', `Beginning dynamic agent simulation (${pipelineSteps.length} steps)...`);

    for (let i = 0; i < pipelineSteps.length; i++) {
      setCurrentStepIndex(i);
      const step = pipelineSteps[i];
      try {
        const res = await executeSingleStep(step, i + 1, pipelineSteps.length);
        if (res?.isolation_required && i < pipelineSteps.length - 1) {
          addLog('CONTAINMENT', 'deny', `Container is frozen by SIGSTOP. Halting remaining simulation steps.`);
          break;
        }
      } catch (err) {
        break;
      }
      await delay(900);
    }

    setActivePipelineStage('COMPLETE');
    addLog('SIMULATION_END', 'info', `Dynamic simulation finished for current task.`);
    setIsSimulating(false);
  };

  // Step single next action
  const stepNextAction = async () => {
    if (!task || isSimulating || currentStepIndex >= pipelineSteps.length) return;
    setIsSimulating(true);
    const step = pipelineSteps[currentStepIndex];
    try {
      await executeSingleStep(step, currentStepIndex + 1, pipelineSteps.length);
      setCurrentStepIndex((prev) => Math.min(prev + 1, pipelineSteps.length));
    } finally {
      setIsSimulating(false);
    }
  };

  // Custom terminal command submit
  const handleCustomCommandSubmit = async (e) => {
    e.preventDefault();
    if (!customCommandInput.trim() || isSimulating || !task) return;
    const cmd = customCommandInput.trim();
    setCustomCommandInput('');
    addLog('USER_CMD', 'thought', `[Agent Shell Prompt] > ${cmd}`);

    let op = 'READ_FILE';
    let res = cmd;
    const parts = cmd.split(' ');
    const first = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ');

    if (first === 'read' || first === 'read_file') {
      op = 'READ_FILE';
      res = rest || '/workspace/input/cloudtrail_events.json';
    } else if (first === 'write' || first === 'write_file') {
      op = 'WRITE_FILE';
      res = rest || '/workspace/output/incident_report.json';
    } else if (first === 'net' || first === 'network' || first === 'curl') {
      op = 'NETWORK';
      res = rest || 'https://exfiltrate.example.org';
    } else if (first === 'exec' || first === 'execute' || first === 'sh') {
      op = 'EXECUTE';
      res = rest || '/bin/sh';
    } else if (first === 'del' || first === 'delete') {
      op = 'DELETE_FILE';
      res = rest || '/workspace/input/cloudtrail_events.json';
    } else if (first === 'db' || first === 'sql') {
      op = 'DATABASE_QUERY';
      res = rest || 'SELECT * FROM accounts;';
    } else if (first === 'key' || first === 'vault') {
      op = 'KEYSTORE_ACCESS';
      res = rest || 'vault://master/key';
    }

    await executeSingleStep(
      {
        name: `Interactive Syscall: ${op}`,
        thought: `Dispatched interactive syscall: ${op}("${res}")`,
        operation: op,
        resource: res,
      },
      1,
      1
    );
  };

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

  const getOpBadgeStyle = (op) => {
    switch (op) {
      case 'READ_FILE':
        return 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300';
      case 'WRITE_FILE':
        return 'bg-teal-950/70 border-teal-500/40 text-teal-300';
      case 'DATABASE_QUERY':
        return 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300';
      case 'KEYSTORE_ACCESS':
        return 'bg-amber-950/70 border-amber-500/40 text-amber-300';
      case 'IPC_CALL':
        return 'bg-purple-950/70 border-purple-500/40 text-purple-300';
      case 'MEMORY_READ':
      case 'MEMORY_WRITE':
        return 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300';
      case 'NETWORK':
        return 'bg-blue-950/70 border-blue-500/40 text-blue-300';
      default:
        return 'bg-slate-900 border-white/[0.1] text-slate-300';
    }
  };

  const EXAMPLE_PROMPTS = [
    {
      label: 'Multi-Resource Cognitive Pipeline',
      prompt: 'Ingest transaction ledger from /workspace/input/swift_transfers.csv, query fraud rules at db://finance/fraud_patterns, sync scratchpad memory at mem://context/working_index, coordinate via ipc://agent/co_verifier, and emit verified executive filing to /workspace/output/fraud_report.json',
    },
    {
      label: 'Cloud Infrastructure Audit',
      prompt: 'Inspect cloud infrastructure access logs in /workspace/input/cloudtrail_events.json, detect anomalous root privilege escalations, and emit a compliance incident report to /workspace/output/incident_report.json',
    },
    {
      label: 'Financial AML Analysis',
      prompt: 'Analyze suspicious high-velocity banking transactions in /workspace/input/swift_transfers.csv and generate a regulatory SAR audit report in /workspace/output/aml_filing.json',
    },
    {
      label: 'Healthcare Patient Records',
      prompt: 'Process anonymized clinical patient vitals in /workspace/input/clinical_records.csv and synthesize epidemiological risk trends into /workspace/output/public_health_trends.md',
    },
  ];

  return (
    <div className="glass-hero p-4 relative overflow-visible bg-gradient-to-r from-slate-900/95 via-[#0b1224]/95 to-slate-900/95 border border-cyan-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.8)] rounded-2xl space-y-4">
      {/* ================= STAGE 1: DEFINE TASK & SCOPE CAPABILITIES ================= */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                Stage 1: Enter Task &amp; Derive Scoped Capabilities via LLM
              </span>
              <p className="text-[11px] text-slate-400">
                The LLM planning component analyzes your natural language task to derive least-privilege capability leases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEventInjector && (
              <button
                type="button"
                onClick={onOpenEventInjector}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-[0_0_16px_rgba(168,85,247,0.45)] hover:scale-[1.03] cursor-pointer border border-white/20"
                title="Open the Interactive Attack & Event Injector console"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                <span>Attack &amp; Event Injector</span>
              </button>
            )}

            {onResetDemo && (
              <button
                onClick={onResetDemo}
                disabled={isSimulating}
                title="Reset agent and token to clean baseline"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reboot Agent</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateLifecycle('COMPLIANT');
          }}
          className="space-y-2.5"
        >
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="e.g. Inspect cloud infrastructure access logs in /workspace/input/cloudtrail_events.json..."
              disabled={isAnalyzing || isSimulating}
              className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-sans shadow-inner"
            />
            <button
              type="submit"
              disabled={isAnalyzing || isSimulating || !taskPrompt.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>LLM Synthesizing Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Analyze &amp; Scope Capabilities</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 font-mono text-[10px]">Quick Examples:</span>
            {EXAMPLE_PROMPTS.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTaskPrompt(ex.prompt)}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] hover:border-cyan-500/40 text-[10px] font-medium transition-all cursor-pointer"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </form>

        {/* Task Analysis Results */}
        {analysis && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-300">{analysis.title}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono">
                    LLM: {analysis.provider} ({analysis.model})
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{analysis.summary}</p>
              </div>
              <button
                onClick={handleAdmitTask}
                disabled={isAdmitting || isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isAdmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Admitting Task...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Admit Task &amp; Issue Tokens</span>
                  </>
                )}
              </button>
            </div>

            {/* Derived Capabilities List */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400 font-mono text-[10px] font-bold">Scoped Capabilities Granted ({analysis.capabilities.length}):</span>
              {analysis.capabilities.map((c, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold transition-all ${getOpBadgeStyle(
                    c.operation
                  )}`}
                >
                  {c.operation} &rarr; {c.resource}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= STAGE 2: DYNAMIC LIFECYCLE CONTROLLER & BUILDER ================= */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-white/[0.08] shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                Stage 2: Dynamic Lifecycle Pipeline &amp; Action Builder
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono font-bold">
                {pipelineSteps.length} SYSCALLS IN PIPELINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Generate scenarios via AI, or pick from the 24-Action Visual Catalog to frame your own custom lifecycle:
            </p>
          </div>

          {/* Scenario & Catalog Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleGenerateLifecycle('COMPLIANT')}
              disabled={isAnalyzing || isSimulating}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                activeScenario === 'COMPLIANT'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-white/[0.06] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ LLM: Compliant</span>
            </button>

            <button
              onClick={() => handleGenerateLifecycle('DRIFT')}
              disabled={isAnalyzing || isSimulating}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                activeScenario === 'DRIFT'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-white/[0.06] hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ LLM: Drift</span>
            </button>

            <button
              onClick={() => handleGenerateLifecycle('INJECTION')}
              disabled={isAnalyzing || isSimulating}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                activeScenario === 'INJECTION'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-white/[0.06] hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>⚡ LLM: Injection</span>
            </button>

            {/* Toggle 24-Action Visual Catalog */}
            <button
              onClick={() => setIsCatalogOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isCatalogOpen
                  ? 'bg-purple-950/80 text-purple-300 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900 text-purple-300 hover:text-white border-purple-500/30'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
              <span>{isCatalogOpen ? 'Hide 24-Action Catalog ▲' : 'Open 24-Action Catalog ▼'}</span>
            </button>

            {onOpenEventInjector && (
              <button
                type="button"
                onClick={onOpenEventInjector}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-rose-950/80 to-purple-950/80 hover:from-rose-900 hover:to-purple-900 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:scale-[1.02] cursor-pointer"
                title="Launch the Interactive Attack & Event Injector console"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Attack Injector Console</span>
              </button>
            )}

            <button
              onClick={() => setIsAddStepOpen((prev) => !prev)}
              disabled={isSimulating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Syscall</span>
            </button>

            {pipelineSteps.length > 0 && (
              <button
                onClick={() => setPipelineSteps([])}
                disabled={isSimulating}
                title="Clear all steps in current pipeline"
                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ================= 24-ACTION VISUAL CAPABILITY & VIOLATION CATALOG ================= */}
        {isCatalogOpen && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  24-Action Visual Catalog: Frame Custom Lifecycles
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono">
                  CLICK TO ADD ANY ACTION
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click any card to add it into your active agent execution pipeline.
              </span>
            </div>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {ACTION_CATALOG.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">{cat.category}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {cat.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        onClick={() => handleAddFromCatalog(item)}
                        className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-white/[0.06] hover:border-purple-500/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-white/[0.08] text-cyan-300 shrink-0">
                              {item.operation}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 truncate">{item.resource}</p>
                        </div>

                        <div className="mt-2 pt-1 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-purple-400 font-semibold group-hover:text-purple-300">
                          <span>+ Add to Lifecycle</span>
                          <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Add Step Form */}
        {isAddStepOpen && (
          <form onSubmit={handleAddCustomStep} className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Inject Custom Syscall into Agent Pipeline
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Step Name (e.g. Query Customer DB)"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                className="bg-slate-950 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <select
                value={newStepOp}
                onChange={(e) => setNewStepOp(e.target.value)}
                className="bg-slate-950 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="READ_FILE">READ_FILE</option>
                <option value="WRITE_FILE">WRITE_FILE</option>
                <option value="DATABASE_QUERY">DATABASE_QUERY</option>
                <option value="KEYSTORE_ACCESS">KEYSTORE_ACCESS</option>
                <option value="NETWORK">NETWORK</option>
                <option value="EXECUTE">EXECUTE</option>
                <option value="DELETE_FILE">DELETE_FILE</option>
                <option value="MEMORY_READ">MEMORY_READ</option>
                <option value="MEMORY_WRITE">MEMORY_WRITE</option>
                <option value="IPC_CALL">IPC_CALL</option>
              </select>
              <input
                type="text"
                placeholder="Resource Path (e.g. /etc/shadow or SELECT * FROM...)"
                value={newStepRes}
                onChange={(e) => setNewStepRes(e.target.value)}
                required
                className="bg-slate-950 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddStepOpen(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Insert Syscall Step
              </button>
            </div>
          </form>
        )}

        {/* Dynamic Pipeline Steps Cards */}
        {pipelineSteps.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-dashed border-white/[0.1] text-slate-400 space-y-2">
            <Layers className="w-6 h-6 text-purple-400 mx-auto" />
            <p className="text-xs">
              No steps in the pipeline. Click an LLM scenario above (e.g. <span className="text-cyan-300">Compliant</span>, <span className="text-amber-300">Drift</span>, or <span className="text-rose-300">Injection</span>), or open the <span className="text-purple-300">24-Action Catalog</span> to frame your own custom sequence!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {pipelineSteps.map((s, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={s.id || idx}
                  className={`p-2.5 rounded-xl border text-xs transition-all relative group flex flex-col justify-between ${
                    isCurrent && isSimulating
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                      : isPast
                      ? 'bg-slate-900/80 border-emerald-500/30 text-slate-300'
                      : 'bg-slate-900/40 border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">
                        STEP {idx + 1}/{pipelineSteps.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                            s.isCorrect
                              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                          }`}
                        >
                          {s.isCorrect ? 'IN-SCOPE' : 'VIOLATION'}
                        </span>
                        {!isSimulating && (
                          <button
                            onClick={() => handleDeleteStep(idx)}
                            title="Remove step"
                            className="text-slate-600 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold text-white truncate text-[11px]">{s.name}</div>
                    <div className="mt-1 font-mono text-[10px] truncate flex items-center gap-1">
                      <span className={`px-1 py-0.2 rounded border text-[9px] ${getOpBadgeStyle(s.operation)}`}>
                        {s.operation}
                      </span>
                      <span className="text-slate-400 truncate">&rarr; {s.resource}</span>
                    </div>
                  </div>
                  {s.thought && (
                    <div className="mt-2 pt-1 border-t border-white/[0.04] text-[10px] italic text-slate-500 line-clamp-1 group-hover:line-clamp-none">
                      {s.thought}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= STAGE 3: REAL-TIME KERNEL SIMULATION & PTY LOGS ================= */}
      <div className="rounded-xl bg-[#060a14] border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="px-3.5 py-2 bg-slate-950 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              agent_sandbox_pty &mdash; Kernel Reference Monitor
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

            <button
              onClick={() => setIsCliOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                isCliOpen
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-white/[0.08]'
              }`}
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>{isCliOpen ? 'Hide Shell ▲' : 'CLI Prompt ▼'}</span>
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

        {/* Dynamic Execution Controls */}
        <div className="p-2.5 bg-slate-950/90 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={runFullPipeline}
              disabled={isSimulating || !task || pipelineSteps.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Agent Syscalls...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Dynamic Simulation</span>
                </>
              )}
            </button>

            <button
              onClick={stepNextAction}
              disabled={isSimulating || !task || currentStepIndex >= pipelineSteps.length}
              title="Execute exactly one step in the dynamic plan"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>
                Step {currentStepIndex + 1}/{pipelineSteps.length} &rarr;
              </span>
            </button>

            {/* Decision & Revocation Matrix Toggle */}
            <button
              onClick={() => setIsMatrixOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] text-[11px] font-semibold transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Decision Rules</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMatrixOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>State:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                securityState === 'NORMAL'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : securityState === 'RESTRICTED'
                  ? 'text-amber-400 border-amber-500/40 bg-amber-500/10 animate-pulse'
                  : 'text-rose-400 border-rose-500/40 bg-rose-500/15 animate-pulse'
              }`}
            >
              {securityState || 'NORMAL'}
            </span>
          </div>
        </div>

        {/* Expandable Decision & Revocation Matrix */}
        {isMatrixOpen && (
          <div className="p-3 bg-slate-950 border-t border-cyan-500/20 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/[0.08]">
              <Shield className="w-4 h-4 text-cyan-400" />
              How Does AEGIS Decide Which Actions are Correct, Wrong, or Revoked?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1. What is CORRECT?
                </span>
                <p className="text-slate-300">
                  Any syscall whose (Operation, Resource) matches an active capability token granted at task admission.
                </p>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 space-y-1">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> 2. What is WRONG?
                </span>
                <p className="text-slate-300">
                  Syscalls targeting ungranted files (<code className="text-rose-300">RESOURCE_MISMATCH</code>), missing tokens (<code className="text-rose-300">NO_CAPABILITY</code>), or honeytokens.
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 3. What gets REVOKED?
                </span>
                <p className="text-slate-300">
                  At <code className="text-amber-300">RESTRICTED</code> (m(U) &ge; 0.60 or K &ge; 0.50), high-impact permissions (<code className="text-amber-300">WRITE_FILE, NETWORK, EXECUTE, KEYSTORE, IPC</code>) are revoked immediately!
                </p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> 4. How to RECOVER?
                </span>
                <p className="text-slate-300">
                  4 consecutive compliant reads in RESTRICTED automatically restore trust and de-escalate state back to <code className="text-cyan-300">NORMAL</code>!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Interactive Agent Shell CLI */}
        {isCliOpen && (
          <div className="p-3 bg-slate-950 border-t border-cyan-500/20 space-y-2">
            <form onSubmit={handleCustomCommandSubmit} className="flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-xs font-bold shrink-0">agent@aegis:~$</span>
              <input
                type="text"
                value={customCommandInput}
                onChange={(e) => setCustomCommandInput(e.target.value)}
                placeholder="e.g. read /workspace/input/... or db SELECT * FROM... or net https://... or exec /bin/sh"
                disabled={isSimulating || !task}
                className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isSimulating || !task || !customCommandInput.trim()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Send Syscall
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
