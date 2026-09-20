# AEGIS-AI: Adaptive OS Security Architecture for Autonomous Agent Execution
## Academic Case Study & Research Evaluation Report

**Authors**: AEGIS-AI Project Team  
**Date**: September 2026  
**Baseline Git Provenance**: Commit `ba17243` (Tagged `phase7-baseline`, Phase 8 Benchmarks, Phase 9 Hardened)  
**Verification Gate**: 39 Passed, 1 Skipped (Docker Container Isolation test skipped when Docker Desktop daemon is absent; logical revocation verified)

---

## Executive Summary & Contribution Statement

Autonomous AI agents executing complex multi-step workflows introduce novel operating system security challenges. Traditional Access Control (DAC, MAC, RBAC) evaluates authority statically at process initialization or call time. Once granted, permissions remain static regardless of runtime agent behavior, leaving systems vulnerable when an autonomous planner hallucinates, encounters prompt injection, or deviates into suspicious activity.

**AEGIS-AI** introduces a prototype closed-loop security architecture designed to mediate, evaluate, and dynamically adjust autonomous agent authority during execution. Every protected operation requested by an agent is intercepted by a kernel-level Reference Monitor. Runtime security observations are transformed into belief mass functions and fused using **Dempster-Shafer (D-S) Evidence Theory**, enabling formal reasoning under explicit epistemic uncertainty. Based on the fused evidence trajectory, an Adaptive Policy Engine transitions system security states (**NORMAL** $\rightarrow$ **RESTRICTED** $\rightarrow$ **CRITICAL**) and triggers automatic capability revocation and container containment.

### Core Research Contribution Statement
> **AEGIS-AI demonstrates a prototype closed-loop security architecture in which autonomous-agent authority is task-scoped, every protected operation is mediated, runtime security observations are represented and fused with explicit uncertainty using Dempster-Shafer evidence theory, and accumulated evidence can dynamically reduce or revoke previously granted authority during execution.**

---

## 1. Problem Statement & Threat Model

### 1.1 Problem Statement
Modern LLM-based agents act as autonomous decision-makers capable of invoking tools (file I/O, network requests, code execution). Existing operating system access control models suffer from two fundamental deficiencies in agentic contexts:
1. **Coarse Over-Privilege**: Agents are typically granted static process-level tokens with sweeping privileges across the local filesystem and network interface.
2. **Static Authority Assumptions**: Traditional security systems ask a single static question: *"Does this identity possess permission $P$ for resource $R$?"* They fail to monitor whether the *pattern of behavior* indicates compromise, hallucination, or adversarial intent over time.

### 1.2 Threat Model
AEGIS-AI models an autonomous agent operating within an untrusted sandbox execution environment.

* **In-Scope Threats**:
  - **Prompt Injection & Misalignment**: External text injected into the agent context forcing it to attempt unauthorized network egress or file access.
  - **Scope Drift & Hallucination**: Agent attempting access to paths outside its task specification (e.g. `/workspace/private/credentials.env`).
  - **Escalating Violations**: Repeated attempts to bypass security controls across multiple operational vectors.
  - **Tool Exploitation**: Malicious payloads passed through tool execution parameters.
* **Out-of-Scope Threats**:
  - Hardware side-channel attacks, microarchitectural speculative execution attacks.
  - Host OS kernel compromise prior to AEGIS bootstrap.
* **Trusted Computing Base (TCB)**:
  - Reference Monitor, Evidence Mapper, D-S Engine, Adaptive Policy Engine, Capability Store, Revocation Controller, and Isolation Manager. The agent and its planner remain strictly *untrusted*.

---

## 2. System Architecture & Closed-Loop Control

```
USER TASK
   ↓
Agent / Planner (Untrusted)
   ↓
AgentClient
   ↓
Secure Tools (secure_read, secure_write, secure_network, secure_execute)
   ↓
[ TRUSTED SECURITY KERNEL (TCB) ]
   ↓
REFERENCE MONITOR ──(Authorization Request)──→ CAPABILITY STORE
   │
   ├── ALLOW ──────────────→ Execute Operation & Log Event
   │
   └── DENY / MONITOR
         ↓
    SecurityEvent
         ↓
   EVIDENCE MAPPER ─────────→ Mass Function m(T), m(U), m(Θ)
         ↓
   D-S TRUST ENGINE ────────→ Combined Belief State & Conflict (K)
         ↓
ADAPTIVE POLICY ENGINE ─────→ Security State (NORMAL / RESTRICTED / CRITICAL)
         ↓
CAPABILITY REVOCATION ──────→ In-Memory Authority Removal
         ↓
  ISOLATION MANAGER ────────→ Physical Container Termination (Docker)
```

The architecture forms a **closed-loop feedback system**:
1. **Mediation**: The `AgentClient` and `Secure Tools` route all requests through `SecurityRuntime.evaluate()`.
2. **Authorization**: `ReferenceMonitor` verifies active, non-expired capability grants in `CapabilityStore`.
3. **Observation**: Security events are mapped into belief mass functions by `EvidenceMapper`.
4. **Fusion**: `DempsterShaferEngine` accumulates historical evidence, explicitly tracking uncertainty $m(\Theta)$ and conflict $K$.
5. **Enforcement**: `AdaptivePolicyEngine` updates state and invokes `RevocationController` to physically revoke capabilities and trigger `IsolationManager`.

---

## 3. Task-Scoped Capability Model

Authority in AEGIS-AI is represented as cryptographically isolated, unforgeable capability objects:

$$\text{Capability} = \langle \text{CapID}, \text{AgentID}, \text{TaskID}, \text{Operation}, \text{ResourceScope}, \text{Status}, \text{Expiration} \rangle$$

* **Operations**: `READ_FILE`, `WRITE_FILE`, `NETWORK`, `EXECUTE`, `DELETE_FILE`.
* **Scope Resolution**: Paths are normalized to canonical POSIX workspace representations. Subpath matching enforces strict boundary containment (e.g., `/workspace/input/` does not grant access to `/workspace/private/`).
* **Dynamic Status**: Status transitions from `ACTIVE` $\rightarrow$ `REVOKED` or `EXPIRED`. Once revoked, any invocation attempt is physically denied at the `ReferenceMonitor` with reason `CAPABILITY_REVOKED`.

---

## 4. Dempster-Shafer Evidence Theory Mathematics

AEGIS-AI uses Dempster-Shafer (D-S) Evidence Theory rather than standard Bayesian probabilities to model security observations.

### 4.1 Frame of Discernment
The frame of discernment $\Theta$ contains two mutually exclusive hypotheses regarding agent behavior:

$$\Theta = \{ T, U \}$$

where $T = \text{Trustworthy}$ and $U = \text{Untrustworthy}$. The power set $2^\Theta$ contains four focal elements:

$$2^\Theta = \{ \emptyset, \{T\}, \{U\}, \{T, U\} \}$$

A mass function (basic probability assignment, BPA) $m: 2^\Theta \rightarrow [0, 1]$ satisfies:

$$m(\emptyset) = 0 \quad \text{and} \quad \sum_{A \subseteq \Theta} m(A) = 1$$

* $m(T)$: Degree of belief supporting trustworthy execution.
* $m(U)$: Degree of belief supporting untrustworthy execution.
* $m(\Theta)$: **Epistemic uncertainty** (ignorance, unassigned belief).

### 4.2 Evidence Mapping Calibration (v1)
Security events are mapped to evidence mass assignments by `EvidenceMapper`:

| Security Observation | $m(T)$ | $m(U)$ | $m(\Theta)$ | Rationale |
| :--- | :---: | :---: | :---: | :--- |
| `AUTHORIZED_OPERATION` | 0.75 | 0.05 | 0.20 | Strong positive evidence, low distrust |
| `UNAUTHORIZED_NETWORK` | 0.10 | 0.60 | 0.30 | Suspicious network probe |
| `UNAUTHORIZED_FILE` | 0.05 | 0.70 | 0.25 | Private file access violation |
| `REPEATED_UNAUTHORIZED` | 0.05 | 0.80 | 0.15 | Escalating intentional violation |
| `GENERIC_DENIAL` | 0.10 | 0.55 | 0.35 | Out-of-policy operation attempt |

### 4.3 Dempster's Rule of Combination
Given two independent mass functions $m_1$ and $m_2$, the combined mass $m_{1,2}(A)$ for any non-empty $A \subseteq \Theta$ is:

$$m_{1,2}(A) = \frac{1}{1 - K} \sum_{B \cap C = A} m_1(B) m_2(C)$$

where $K$ represents the **conflict parameter**:

$$K = \sum_{B \cap C = \emptyset} m_1(B) m_2(C) = m_1(T) m_2(U) + m_1(U) m_2(T)$$

* **Conflict $K \in [0, 1]$** measures the degree of contradiction between evidence sources (e.g. alternating highly trustworthy and highly untrustworthy operations).
* If $K = 1$, the sources are in total conflict and combination is undefined.

---

## 5. Adaptive Security Policy Engine

The `AdaptivePolicyEngine` evaluates the current fused trust state $\text{TrustState}(m(T), m(U), m(\Theta), K)$ against policy thresholds:

* **Default Policy Configuration**:
  - Restriction threshold: $m(U) \ge 0.60$
  - Critical threshold: $m(U) \ge 0.85$
  - High conflict threshold: $K \ge 0.50$
  - Critical conflict threshold: $K \ge 0.80$

### 5.1 Security State Machine
```
   ┌─────────┐   m(U) ≥ 0.60 or K ≥ 0.50   ┌────────────┐
   │ NORMAL  │ ───────────────────────────→ │ RESTRICTED │
   └─────────┘                              └────────────┘
        │                                         │
        │           m(U) ≥ 0.85 or K ≥ 0.80       │
        └─────────────────────────────────────────┘
                            │
                            ▼
                     ┌────────────┐
                     │  CRITICAL  │
                     └────────────┘
```

* **Monotonic Escalation Guarantee**: State transitions only move upward ($\text{NORMAL} \rightarrow \text{RESTRICTED} \rightarrow \text{CRITICAL}$). Automatic state downgrade is prevented to protect against deceptive adversarial recovery strategies.
* **State Actions**:
  - **RESTRICTED**: Revokes write/network capabilities (`WRITE_FILE`, `NETWORK`, `EXECUTE`, `DELETE_FILE`), retaining read-only capabilities (`READ_FILE`).
  - **CRITICAL**: Revokes all remaining capabilities (`READ_FILE`), raises `isolation_required = True`, and triggers container shutdown via `IsolationManager`.

---

## 6. Experimental Methodology & Measured Results

All experimental evaluation was executed under git baseline commit `ba17243` using `experiments.benchmark`. Evaluation parameters: 5 warmup runs, 30 measured runs per scenario.

### 6.1 Empirical Scenario Benchmark Results

| Scenario | Task Comp% | False Revocation% | Blocking% | Mean $m(U)$ | Mean $K$ | Final State Distribution |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `normal_agent` | **100.0%** | **0.0%** | 100.0% | 0.0243 | 0.0750 | 30 NORMAL |
| `accidental_violation` | **100.0%** | **0.0%** | **100.0%** | 0.1542 | 0.5275 | 30 RESTRICTED |
| `unauthorized_network` | **100.0%** | **0.0%** | **100.0%** | 0.3028 | 0.4550 | 30 NORMAL |
| `unauthorized_file` | **100.0%** | **0.0%** | **100.0%** | 0.3968 | 0.5275 | 30 RESTRICTED |
| `repeated_violation` | **100.0%** | **0.0%** | **100.0%** | 0.9299 | 0.4849 | 30 CRITICAL |
| `severe_violation` | **100.0%** | **0.0%** | **100.0%** | 0.9218 | 0.5043 | 30 CRITICAL |
| `conflicting_evidence` | **100.0%** | **0.0%** | **100.0%** | 0.3989 | 0.5779 | 30 RESTRICTED |

### 6.2 Key Empirical Findings

1. **Zero False Revocations on Normal Workload**: Across 30 measured runs of `normal_agent`, task completion rate was **100.0%** with **0.0% false revocation rate**.
2. **Perfect Enforcement of Deliberately Unauthorized Operations**: Across all adversarial scenarios (`accidental_violation`, `unauthorized_network`, `unauthorized_file`, `repeated_violation`, `severe_violation`, `conflicting_evidence`), unauthorized attempts were blocked at a rate of **100.0%**.
3. **Reliable Escalation on Escalating & Severe Threats**: All 30 runs of `repeated_violation` and `severe_violation` escalated to **CRITICAL** state, resulting in total capability revocation.
4. **Sensitivity Threshold Sweep**: Sweeping restriction threshold $m(U) \in [0.50, 0.75]$ and critical threshold $m(U) \in [0.75, 0.95]$ across 29 valid threshold pairs confirmed that **29 / 29 (100%)** maintained 0.0% false revocation rate on benign agent workloads.
5. **Runtime Overhead**: Absolute security evaluation overhead was measured at **$+0.0535 \text{ ms}$ ($53.5\ \mu\text{s}$)** per operation evaluation compared to raw unmediated execution.

---

## 7. Limitations & Threats to Validity

1. **Prototype Scope**: These experimental findings represent prototype evaluations within the defined scenario suite and do not constitute universal formal security guarantees against arbitrary zero-day vulnerabilities.
2. **Docker Dependency**: Physical container termination relies on an active Docker Desktop daemon. When Docker is unavailable, AEGIS logs `ISOLATION_REQUESTED` and enforces logical authority revocation, but physical process kill is skipped.
3. **Static Evidence Mapping**: Evidence masses ($m(T), m(U), m(\Theta)$) are calibrated via configuration `v1` rather than dynamically learned via online reinforcement learning.

---

## 8. Conclusion & Future Work

AEGIS-AI demonstrates that adaptive, closed-loop security mediation can bridge the gap between static OS access controls and dynamic autonomous AI agent execution. By unifying task-scoped capabilities, reference monitor mediation, Dempster-Shafer uncertainty reasoning, and dynamic policy revocation, AEGIS-AI provides a practical, academically defensible model for safe autonomous execution.

Future research includes online learning of evidence mass functions, eBPF-based host kernel mediation, and hardware-enforced confidential computing sandbox integration.

---

### Key Summary Line
> *Traditional access control asks what an application is allowed to do. AEGIS-AI continuously asks a second question: based on the evidence available now, should an autonomous agent still retain authority that was previously granted?*
