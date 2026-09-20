# AEGIS-AI: Presentation Deck
## Adaptive OS Security Architecture for Autonomous Agent Execution

**15-Slide Presentation Deck with Speaker Notes & Visual Layout Guidance**

---

### Slide 1: Title Slide
* **Title**: AEGIS-AI: Adaptive OS Security Architecture for Autonomous Agent Execution
* **Subtitle**: Closed-Loop Authority Mediation & Evidence-Driven Revocation for AI Agents
* **Presenter**: AEGIS-AI Project Team
* **Context**: Operating Systems Advanced Case Study & Research Project

---

### Slide 2: The Autonomous Agent Authority Problem
* **Visual**: Diagram showing an LLM planner issuing tool calls to local filesystem, shell, and network sockets without runtime boundary checks.
* **Key Bullet Points**:
  * Autonomous AI agents execute non-deterministic, multi-step tasks by selecting and chaining tools.
  * Agents act on behalf of users, but their internal decision-making is probabilistic and vulnerable to hallucination or prompt injection.
  * Giving agents persistent, broad OS user permissions creates extreme over-privilege risks.

---

### Slide 3: Research Question
* **Visual**: Highlighted callout box with the core research question.
* **Core Question**:
  > *How can an operating system dynamically measure, evaluate, and constrain the runtime authority of an autonomous AI agent as its operational behavior unfolds?*
* **Target Objective**: Build a closed-loop security architecture that continuously reconciles agent authority with observed behavioral evidence.

---

### Slide 4: Why Static Access Control is Insufficient
* **Visual**: Comparison matrix: Traditional Access Control (DAC/MAC/RBAC) vs. AEGIS-AI Dynamic Control.
* **Key Bullet Points**:
  * **Static Evaluation**: Traditional OS access control evaluates authority only at process invocation or call time based on fixed identity tokens.
  * **No Behavioral Context**: Static controls cannot distinguish between a benign file read and a prompt-injected exfiltration sequence using the same permission.
  * **All-or-Nothing**: Once granted, static permissions remain active until manual intervention or process termination.

---

### Slide 5: The AEGIS-AI System Architecture
* **Visual**: High-level block diagram showing Untrusted Agent Domain separated by a clear TCB boundary from the Security Kernel (Reference Monitor, D-S Engine, Adaptive Policy Engine, Capability Store).
* **Key Bullet Points**:
  * Strict separation between untrusted agent code and host-side Trusted Computing Base (TCB).
  * Every tool call (`secure_read`, `secure_write`, `secure_network`, `secure_execute`) is intercepted by `SecurityRuntime`.
  * Complete audit logging and SQLite persistent state replication.

---

### Slide 6: Task-Scoped Capability Model
* **Visual**: Structure of an unforgeable Capability Object: $\langle \text{CapID}, \text{AgentID}, \text{TaskID}, \text{Op}, \text{ResourceScope}, \text{Status}, \text{Expiration} \rangle$.
* **Key Bullet Points**:
  * Capabilities are task-derived, transient, and strictly scoped to specific resource subpaths.
  * Support for granular operations: `READ_FILE`, `WRITE_FILE`, `NETWORK`, `EXECUTE`, `DELETE_FILE`.
  * Status transitions: `ACTIVE` $\rightarrow$ `REVOKED` or `EXPIRED`.

---

### Slide 7: Reference Monitor Mediation & Fail-Closed Enforcement
* **Visual**: Sequence flowchart showing request interception, boundary scope checking, active status verification, and instant denial.
* **Key Bullet Points**:
  * Every operation MUST pass reference monitor authorization before reaching host OS APIs.
  * Fail-closed architecture: Any request lacking an active, non-expired, matching capability is DENIED immediately.
  * Prevents workspace path traversal and illegal resource accesses.

---

### Slide 8: Modeling Security Observations with Dempster-Shafer Uncertainty
* **Visual**: Diagram of the Frame of Discernment $\Theta = \{T, U\}$ and mass assignment distribution $m(T) + m(U) + m(\Theta) = 1$.
* **Key Bullet Points**:
  * **Why D-S?** Standard probability forces binary belief ($P(T) + P(U) = 1$). D-S explicitly represents **epistemic uncertainty** $m(\Theta)$ (ignorance).
  * Observations map to mass functions: `AUTHORIZED_OPERATION` ($m(T)=0.75$), `UNAUTHORIZED_FILE` ($m(U)=0.70$).
  * **Conflict $K$**: Explicitly quantifies contradiction between positive and negative evidence streams.

---

### Slide 9: Adaptive Policy Engine & Monotonic Revocation
* **Visual**: State Machine Transition Diagram: NORMAL $\rightarrow$ RESTRICTED $\rightarrow$ CRITICAL.
* **Key Bullet Points**:
  * Policy thresholds evaluate $m(U)$ and conflict $K$:
    - $m(U) \ge 0.60$ or $K \ge 0.50 \rightarrow$ **RESTRICTED** (Revokes write/network; retains read-only).
    - $m(U) \ge 0.85$ or $K \ge 0.80 \rightarrow$ **CRITICAL** (Revokes ALL capabilities; triggers isolation).
  * **Monotonicity Guarantee**: Security states only escalate upward; automatic downgrade is prohibited to prevent deceptive recovery attacks.

---

### Slide 10: Technical Implementation Overview
* **Visual**: Tech stack hierarchy: Python 3.12 Backend, FastAPI, SQLite, Docker Manager, React 18 / Vite / Tailwind SOC Dashboard.
* **Key Bullet Points**:
  * Host-side `SecurityRuntime` coordinates asynchronous/synchronous enforcement loops.
  * Real-time WebSocket event dispatching to modern Security Operations Center (SOC) dashboard.
  * Modular design separating capability management, evidence mapping, trust fusion, and container isolation.

---

### Slide 11: Phase 9 Showcase Sequence Demonstration
* **Visual**: Step-by-step walkthrough of the 10-step showcase demo.
* **Key Demo Steps**:
  1. **Clean Reset**: Baseline DB initialization.
  2. **Legitimate Task**: `READ` & `WRITE` succeed; summary file created physically.
  3. **Unauthorized NETWORK**: DENIED; D-S Conflict $K=0.5619 \ge 0.50$ triggers RESTRICTED; `WRITE` capability revoked.
  4. **Post-Revocation Test**: `WRITE` attempt physically DENIED with `CAPABILITY_REVOKED`.
  5. **Severe Violation**: `EXECUTE` DENIED; state becomes CRITICAL; ALL authority revoked; `ISOLATION_REQUESTED` logged.

---

### Slide 12: Quantitative Experimental Evaluation (Phase 8 Results)
* **Visual**: Measured Results Summary Table across 30 runs per scenario.
* **Key Findings (Experimental Suite Metrics)**:
  * **Benign Workload**: **100.0% task completion** and **0.0% false revocation rate** across 30 runs of `normal_agent`.
  * **Adversarial Workloads**: **100.0% blocking rate** on deliberately unauthorized operations across all 6 attack scenarios.
  * **Escalation**: 30/30 runs of `repeated_violation` and `severe_violation` escalated to CRITICAL.
  * **Sensitivity Sweep**: **29 / 29 (100%)** threshold configurations maintained 0.0% false revocation on normal workloads.
  * **Latency Overhead**: **$+0.0535 \text{ ms}$ ($53.5\ \mu\text{s}$)** average security evaluation overhead per operation.

---

### Slide 13: System Limitations & Validity Scope
* **Visual**: Highlighted limitations summary box.
* **Key Bullet Points**:
  * Results reflect prototype experimental scenario findings, not universal formal guarantees.
  * Physical container shutdown relies on Docker Desktop availability; when absent, logical authority revocation and `ISOLATION_REQUESTED` are verified.
  * Evidence mass assignments ($v1$) are static heuristics; online ML mass calibration remains future work.

---

### Slide 14: Core Contribution Statement
* **Visual**: Framed quote box with the primary research contribution.
* **Contribution Statement**:
  > **AEGIS-AI demonstrates a prototype closed-loop security architecture in which autonomous-agent authority is task-scoped, every protected operation is mediated, runtime security observations are represented and fused with explicit uncertainty using Dempster-Shafer evidence theory, and accumulated evidence can dynamically reduce or revoke previously granted authority during execution.**

---

### Slide 15: Conclusion & Closing Reflection
* **Visual**: Highlighted closing statement.
* **Closing Line**:
  > *Traditional access control asks what an application is allowed to do. AEGIS-AI continuously asks a second question: based on the evidence available now, should an autonomous agent still retain authority that was previously granted?*
* **Q&A**: Thank you! Open for Viva Defense Questions.
