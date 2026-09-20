# AEGIS-AI: Comprehensive Viva Defense Pack
## 50 Questions & Answers for Examination & Academic Defense

---

### Category A: Core Security Architecture & OS Principles

#### Q1: What is the core problem AEGIS-AI addresses in autonomous AI agent security?
**Answer**: Traditional operating system access control models (DAC, MAC, RBAC) evaluate permissions statically at process initialization or call time. Once granted, permissions remain static regardless of runtime behavior. Autonomous AI agents execute non-deterministic tool chains where hallucination or prompt injection can turn a previously trusted agent malicious. AEGIS-AI introduces a closed-loop security architecture that continuously evaluates runtime behavior and dynamically revokes authority during execution.

#### Q2: What is the Trusted Computing Base (TCB) of AEGIS-AI?
**Answer**: The TCB consists of the host-side `SecurityRuntime`, `ReferenceMonitor`, `CapabilityStore`, `EvidenceMapper`, `DempsterShaferEngine`, `AdaptivePolicyEngine`, `RevocationController`, `IsolationManager`, and SQLite database audit sink. The autonomous agent, its LLM planner, and agent tools are untrusted.

#### Q3: Can an autonomous agent bypass the Reference Monitor?
**Answer**: No. All agent interaction with external resources (filesystem, network, subprocesses) is mediated through `AgentClient` and `Secure Tools` (`SecureRead`, `SecureWrite`, `SecureNetwork`, `SecureExecute`). Each tool unconditionally calls `SecurityRuntime.evaluate()`. If authorization fails, the tool raises a `PermissionError` before invoking underlying OS system calls.

#### Q4: How are capabilities in AEGIS-AI different from traditional file permissions?
**Answer**: Traditional file permissions (e.g. POSIX `chmod` 0644) belong to a persistent user account. AEGIS capabilities are unforgeable, transient objects scoped to a specific `(AgentID, TaskID)` pair and a canonical resource subpath (e.g., `/workspace/input/`). They possess dynamic status (`ACTIVE`, `REVOKED`, `EXPIRED`) and can be dynamically invalidated by the security kernel at runtime.

#### Q5: What is the distinction between logical authority revocation and physical container isolation?
**Answer**: Logical authority revocation marks the capability object as `REVOKED` in the `CapabilityStore`, causing subsequent Reference Monitor authorization checks to fail immediately. Physical container isolation shuts down the Docker container running the agent process (`docker stop/kill`). If Docker Desktop is unavailable, AEGIS logs `ISOLATION_REQUESTED` and enforces logical authority revocation.

---

### Category B: Dempster-Shafer Evidence Theory & Mathematics

#### Q6: Why did AEGIS-AI choose Dempster-Shafer (D-S) Evidence Theory over Bayesian probability?
**Answer**: Bayesian probability requires specifying complete prior and conditional distributions and enforces $P(\text{Trustworthy}) + P(\text{Untrustworthy}) = 1$. In security contexts, early in a task we lack evidence rather than having strong proof of trust. D-S theory allows explicit representation of **epistemic uncertainty (ignorance)** $m(\Theta)$. When no evidence is present, $m(\Theta) = 1.0$ while $m(T) = 0$ and $m(U) = 0$.

#### Q7: What is the Frame of Discernment $\Theta$ in AEGIS-AI?
**Answer**: $\Theta = \{ T, U \}$, where $T$ represents Trustworthy behavior and $U$ represents Untrustworthy behavior. The focal sets are $\emptyset$, $\{T\}$, $\{U\}$, and $\{T, U\} \equiv \Theta$.

#### Q8: What does the mass assignment $m(\Theta)$ signify physically?
**Answer**: $m(\Theta)$ represents uncommitted belief or uncertainty (ignorance). It reflects the portion of evidence that cannot be conclusively assigned to either purely trustworthy or untrustworthy behavior due to incomplete observations.

#### Q9: What is the Conflict Parameter $K$ in Dempster's Rule of Combination?
**Answer**: $K$ measures the degree of contradiction between two independent mass functions $m_1$ and $m_2$:
$$K = \sum_{B \cap C = \emptyset} m_1(B) m_2(C) = m_1(T) m_2(U) + m_1(U) m_2(T)$$
When $K$ is small, evidence sources agree. As $K \rightarrow 1.0$, evidence sources strongly contradict each other.

#### Q10: How does AEGIS-AI use conflict $K$ in policy decisions?
**Answer**: High evidence conflict ($K \ge 0.50$) indicates anomalous behavior—such as an agent establishing strong positive trust followed by suspicious unauthorized requests. AEGIS-AI uses high conflict as a conservative security trigger, transitioning the state to `RESTRICTED` even if $m(U)$ alone has not yet crossed the restriction threshold.

#### Q11: What assumptions does Dempster's Rule of Combination make, and how does AEGIS handle them?
**Answer**: Dempster's rule assumes evidence sources are conditionally independent and that the frame of discernment is exhaustive. In AEGIS-AI, security events represent distinct sequential operations. If conflict reaches $K = 1.0$ (total contradiction), Dempster's rule is undefined; AEGIS handles this edge case by failing closed and triggering emergency isolation.

#### Q12: Why doesn't a single denied operation prove an agent is malicious?
**Answer**: A single denied operation could be an accidental mistake (e.g. slight path misspelling or tool formatting error). Assigning binary maliciousness on a single event causes high false-positive rates. D-S theory allows a single event to contribute moderate distrust mass ($m(U) = 0.60, m(\Theta) = 0.30$) without immediately declaring the entire task critical.

#### Q13: Why is high conflict $K$ not itself absolute proof of an attack?
**Answer**: High conflict means the agent's history contains both strongly benign and strongly suspicious actions. While this can happen during prompt injection mid-task, it could also result from a complex multi-stage legitimate task encountering an out-of-scope resource. AEGIS treats high conflict as a signal to *restrict* write/network authority rather than immediately terminating the agent.

#### Q14: How were the mass function parameters $m(T), m(U), m(\Theta)$ in EvidenceMapper v1 selected?
**Answer**: Mass functions were calibrated based on domain heuristics and validated empirically during Phase 8 benchmark sensitivity sweeps. For example, `AUTHORIZED_OPERATION` provides $m(T)=0.75, m(\Theta)=0.20$, while `UNAUTHORIZED_FILE` provides $m(U)=0.70, m(\Theta)=0.25$.

---

### Category C: Security Policy & State Machine

#### Q15: What are the three security states in AEGIS-AI?
**Answer**: `NORMAL` (full task capabilities), `RESTRICTED` (read-only mode; write/network revoked), and `CRITICAL` (all capabilities revoked; container isolation triggered).

#### Q16: What is the Monotonic Escalation Property in the Adaptive Policy Engine?
**Answer**: State transitions can only move upward (`NORMAL` $\rightarrow$ `RESTRICTED` $\rightarrow$ `CRITICAL`). Automatic downgrade to lower security states is strictly prohibited. This prevents deceptive agents from attempting benign operations after a violation to reset their security state.

#### Q17: What are the default threshold parameters used in AEGIS-AI?
**Answer**:
- Restriction threshold: $m(U) \ge 0.60$ or $K \ge 0.50$
- Critical threshold: $m(U) \ge 0.85$ or $K \ge 0.80$

#### Q18: What happens when an agent reaches the RESTRICTED state?
**Answer**: The `RevocationController` revokes all `WRITE_FILE`, `NETWORK`, `EXECUTE`, and `DELETE_FILE` capabilities associated with the task, while preserving `READ_FILE` capabilities. Any subsequent write attempt is denied by the Reference Monitor with reason `CAPABILITY_REVOKED`.

#### Q19: What happens when an agent reaches the CRITICAL state?
**Answer**: All remaining capabilities (including `READ_FILE`) are revoked. `isolation_required = True` is returned, and `IsolationManager` attempts physical shutdown of the container.

---

### Category D: Implementation & Engineering

#### Q20: What programming languages and frameworks are used in AEGIS-AI?
**Answer**: Backend: Python 3.12, FastAPI, SQLAlchemy, SQLite, Pytest. Frontend: React 18, Vite, Vanilla CSS. Containerization: Docker & Docker SDK for Python.

#### Q21: How is thread safety ensured within `SecurityRuntime`?
**Answer**: `SecurityRuntime` uses a reentrant lock (`threading.RLock`) around state updates, trust calculations, and capability revocations to guarantee atomic state transitions during multi-threaded agent execution.

#### Q22: How does the persistent audit sink work?
**Answer**: Every security event, trust state snapshot, policy transition, and capability revocation is recorded synchronously to an SQLite database via SQLAlchemy, enabling post-incident forensic reconstruction.

#### Q23: How does the React SOC Dashboard receive updates?
**Answer**: The dashboard connects to the FastAPI backend via WebSockets (`/ws`). When security state changes or revocations occur, `SecurityRuntime` broadcasts JSON event envelopes to connected clients.

---

### Category E: Experimental Evaluation & Measured Results

#### Q24: What was the false revocation rate measured on normal agent workloads in Phase 8?
**Answer**: Across 30 measured runs of `normal_agent`, the false revocation rate was **0.0%** and the task completion rate was **100.0%**.

#### Q25: What was the blocking rate on deliberately unauthorized operations across attack scenarios?
**Answer**: Across all 6 attack scenarios (`accidental_violation`, `unauthorized_network`, `unauthorized_file`, `repeated_violation`, `severe_violation`, `conflicting_evidence`), the blocking rate was **100.0%**.

#### Q26: What was the average security evaluation overhead per operation?
**Answer**: The measured latency overhead of the full AEGIS security pipeline (`SecurityRuntime` evaluation, D-S fusion, policy check, store lookup) was **$+0.0535 \text{ ms}$ ($53.5\ \mu\text{s}$)** per operation.

#### Q27: How many threshold configurations were evaluated during the sensitivity sweep?
**Answer**: 29 valid threshold pairs were evaluated in `experiments/threshold_sweep.py`. All 29 configurations (**100%**) maintained a 0.0% false revocation rate on normal agent workloads.

#### Q28: How were latency measurements conducted to ensure precision?
**Answer**: Latencies were measured using nanosecond-precision CPU clocks (`time.perf_counter_ns()`) wrapped in Python context managers, separating detection latency from state settlement latency.

---

### Category F: Advanced & Challenging Defense Questions

#### Q29: Is AEGIS-AI implemented inside the OS kernel (e.g. Linux LSM/eBPF)?
**Answer**: AEGIS-AI is an application-level security runtime prototype designed to model OS security architecture concepts. While conceptually acting as an OS Reference Monitor, its current implementation runs in user-space as a host security mediator. Future work includes porting the Reference Monitor to eBPF / Linux LSM modules.

#### Q30: What prevents an agent from modifying the AEGIS SQLite database file?
**Answer**: The SQLite database file resides outside the workspace directory on the host file system. Agents execute within a restricted workspace path or isolated Docker container without host filesystem permissions.

#### Q31: How does AEGIS-AI handle workspace path traversal attempts (e.g. `/workspace/../etc/passwd`)?
**Answer**: All resource paths are resolved and normalized using Python's `Path.resolve()`. If the resolved candidate path does not contain `workspace_root` in its parent hierarchy, `SecureRead`/`SecureWrite` raises a `PermissionError` for workspace traversal denial.

#### Q32: Could an attacker bypass AEGIS by inventing new tool names?
**Answer**: No. Tools must be instantiated with an `AgentClient` handle. If an agent invokes an unmediated raw system API, container isolation or host OS process restrictions prevent execution.

#### Q33: Why did Step 5 of the Phase 9 Showcase Demo trigger RESTRICTED on a single network probe?
**Answer**: In Step 4, the agent completed two authorized operations (`READ` + `WRITE`), establishing high trustworthy belief ($m(T) = 0.9324$). When Step 5 introduced an unauthorized network probe ($m(U) = 0.60$), the D-S fusion produced a high evidence conflict ($K = 0.5619$). Because $K \ge 0.50$ (the high conflict threshold), the policy engine conservatively escalated state to `RESTRICTED` and revoked `WRITE_FILE`.

#### Q34: What is the difference between $m(U)$ threshold escalation and Conflict $K$ threshold escalation?
**Answer**: $m(U)$ escalation occurs when accumulated distrust mass directly crosses a threshold ($0.60$ or $0.85$). Conflict $K$ escalation occurs when contradictory evidence creates high ambiguity ($0.50$ or $0.80$), causing AEGIS to take a conservative safety stance even if pure distrust mass is still low.

#### Q35: What happens if an agent's capability expires during operation?
**Answer**: The `ReferenceMonitor` evaluates `capability.is_active()`, which checks both status (`ACTIVE`) and expiration timestamp. Expired capabilities return `ALLOW = False` with reason `CAPABILITY_EXPIRED`.

#### Q36: Why does AEGIS keep `READ_FILE` active in the RESTRICTED state?
**Answer**: `RESTRICTED` mode represents a "read-only sandbox". It prevents the agent from exfiltrating data (network) or corrupting state (write/delete), while allowing it to complete diagnostic or read-only tasks if the violation was minor or accidental.

#### Q37: Can capability revocation be reversed if an agent later behaves well?
**Answer**: In the current design, revocation is monotonic within a single task session to prevent deceptive recovery attacks. Task restoration requires explicit administrative reset or a new user-approved task context.

#### Q38: How does AEGIS-AI compare to static container security profiles (AppArmor/Seccomp)?
**Answer**: AppArmor and Seccomp enforce static syscall filters applied at container startup. They cannot adapt filters mid-execution based on historical behavior. AEGIS-AI dynamically adjusts active permissions based on real-time evidence fusion.

#### Q39: What is the main threat to validity in the Phase 8 experimental results?
**Answer**: The results are derived from a benchmark scenario suite with pre-calibrated mass assignments ($v1$). They demonstrate prototype correctness and performance, but do not guarantee safety against unmodeled zero-day attack vectors.

#### Q40: What is the computational complexity of Dempster's combination rule in AEGIS?
**Answer**: Because the frame of discernment $\Theta = \{T, U\}$ contains only 2 elements ($2^\Theta = 4$ focal elements), evidence fusion involves multiplying $4 \times 4 = 16$ terms per event. This takes under $5\ \mu\text{s}$, explaining AEGIS's minimal overhead ($53.5\ \mu\text{s}$ total).

#### Q41: How does AEGIS handle prompt injection?
**Answer**: AEGIS does not inspect prompt text directly. Instead, it mediates the *actions* the prompt attempts to execute. If prompt injection causes an agent to attempt unauthorized operations, AEGIS blocks the actions and revokes capabilities regardless of the agent's internal reasoning.

#### Q42: What is the role of `AgentClient`?
**Answer**: `AgentClient` is a narrow, typed interface that wraps `SecurityRuntime.evaluate()`, ensuring that agent code never has direct access to internal capability stores or policy engines.

#### Q43: What audit evidence is stored when a capability is revoked?
**Answer**: The audit log records timestamp, `capability_id`, `agent_id`, `task_id`, `operation`, `resource`, policy state transition details, and the full D-S mass snapshot ($m(T), m(U), m(\Theta), K$).

#### Q44: What is the purpose of `scripts/reset_demo.ps1`?
**Answer**: It restores a clean, deterministic starting state by clearing SQLite database tables and deleting temporary workspace output files, ensuring reproducible demo runs.

#### Q45: How does the system behave if Docker Desktop is not installed?
**Answer**: `DockerManager` raises a `DockerUnavailableError`. Integration tests mark physical container isolation as `SKIPPED`, while the security kernel continues to enforce logical authority revocation and log `ISOLATION_REQUESTED`.

#### Q46: What constitutes a "severe violation" in AEGIS?
**Answer**: Operations with high intrinsic risk (e.g. `EXECUTE` on shell scripts or `DELETE_FILE` on database files) mapped with high distrust mass ($m(U) \ge 0.80$), driving state to `CRITICAL` in a single or repeated attempt.

#### Q47: Why is least-privilege capability derivation important at task creation?
**Answer**: By granting only the minimal capabilities required for a task at initialization, any attempt by an agent to access unauthorized resources triggers immediate reference monitor denial and evidence generation.

#### Q48: Could AEGIS-AI be integrated into Linux kernel modules?
**Answer**: Yes. A production implementation could implement the Reference Monitor as an eBPF LSM (Linux Security Module) probe, with the D-S engine running in a dedicated host security daemon.

#### Q49: What is the primary academic novelty of AEGIS-AI?
**Answer**: Combining task-scoped capability mediation with Dempster-Shafer uncertainty fusion and dynamic monotonic policy revocation for autonomous AI agent execution.

#### Q50: Summarize AEGIS-AI in one sentence.
**Answer**: AEGIS-AI is a prototype closed-loop security architecture that task-scopes AI agent authority, mediates every operation, fuses security observations using Dempster-Shafer uncertainty theory, and dynamically revokes authority when anomalous behavior is detected.
