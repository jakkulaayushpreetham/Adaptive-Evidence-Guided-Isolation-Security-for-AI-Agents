# AEGIS-AI: Architecture & Research Diagrams

This document contains canonical Mermaid diagrams illustrating the AEGIS-AI system architecture, security boundary, evidence fusion process, state transitions, and Phase 9 showcase sequence.

---

## 1. High-Level System Architecture & Trusted/Untrusted Boundary

```mermaid
graph TB
    subgraph UntrustedDomain["UNTRUSTED AGENT DOMAIN"]
        USER["User Task Specification"] --> PLANNER["Agent / Planner"]
        PLANNER --> CLIENT["AgentClient"]
        CLIENT --> TOOLS["Secure Tools<br/>(secure_read, secure_write, secure_network, secure_execute)"]
    end

    subgraph TrustedDomain["TRUSTED COMPUTING BASE (TCB)"]
        RUNTIME["SecurityRuntime (Coordinator)"]
        MONITOR["ReferenceMonitor"]
        STORE["CapabilityStore"]
        MAPPER["EvidenceMapper"]
        DS["DempsterShaferEngine"]
        POLICY["AdaptivePolicyEngine"]
        REVOCATION["RevocationController"]
        ISOLATION["IsolationManager"]
        DB[("SQLite Database<br/>(Audit Sink)")]
    end

    TOOLS -- "1. Request Operation" --> RUNTIME
    RUNTIME -- "2. Check Capability" --> MONITOR
    MONITOR -- "Lookup Active Cap" --> STORE
    MONITOR -- "3. SecurityEvent" --> MAPPER
    MAPPER -- "4. Mass Assignment m(T), m(U), m(Θ)" --> DS
    DS -- "5. Fused Trust & Conflict K" --> POLICY
    POLICY -- "6. SecurityState Decision" --> REVOCATION
    REVOCATION -- "7. Revoke Capability" --> STORE
    REVOCATION -- "8. Container Shutdown" --> ISOLATION
    RUNTIME -- "9. Persist Event & Audit Log" --> DB

    style UntrustedDomain fill:#fff0f0,stroke:#d9534f,stroke-width:2px;
    style TrustedDomain fill:#f0f8ff,stroke:#0275d8,stroke-width:2px;
```

---

## 2. Closed-Loop Enforcement & Feedback Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Agent Tool
    participant Runtime as SecurityRuntime
    participant Monitor as ReferenceMonitor
    participant Mapper as EvidenceMapper
    participant DS as DempsterShaferEngine
    participant Policy as AdaptivePolicyEngine
    participant Revocation as RevocationController

    Agent->>Runtime: evaluate(agent_id, task_id, operation, resource)
    Runtime->>Monitor: authorize(agent_id, task_id, operation, resource)
    Monitor-->>Runtime: AuthorizationResult (ALLOWED / DENIED) + SecurityEvent
    Runtime->>Mapper: map(SecurityEvent, repeated)
    Mapper-->>Runtime: Evidence Mass Assignment [m(T), m(U), m(Θ)]
    Runtime->>DS: apply(Evidence, TrustState)
    DS-->>Runtime: Updated TrustState [m(T), m(U), m(Θ), Conflict K]
    Runtime->>Policy: evaluate(TrustState, CurrentState)
    Policy-->>Runtime: PolicyDecision (proposed_state, state_changed, reason)
    Runtime->>Revocation: apply(agent_id, task_id, PolicyDecision)
    Revocation-->>Runtime: RevocationResult (revoked_capabilities, isolation_required)
    Runtime-->>Agent: RuntimeResult (authorization, security_state, isolation_required)
```

---

## 3. Dempster-Shafer Evidence Fusion Engine Process

```mermaid
flowchart TD
    E[Security Event Observed] --> M[EvidenceMapper Calibration v1]
    M --> B[New Mass Assignment m_new]
    
    T_prev[Previous Trust State m_prev] --> F[Dempster Combination Rule]
    B --> F
    
    F --> K_calc["Calculate Conflict K = ∑ m_prev(B) * m_new(C) for B ∩ C = ∅"]
    
    K_calc --> K_check{"Is K >= 1.0?"}
    K_check -- Yes --> ERR[Reject Combination / Emergency Isolation]
    K_check -- No --> N[Normalize by 1 / 1 - K]
    
    N --> Fused["Updated Fused Mass m_fused(T), m_fused(U), m_fused(Θ)"]
    Fused --> P[Adaptive Policy Engine Evaluation]

    style K_calc fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    style Fused fill:#d4edda,stroke:#28a745,stroke-width:2px
```

---

## 4. Security State Machine (NORMAL → RESTRICTED → CRITICAL)

```mermaid
stateDiagram-v2
    [*] --> NORMAL : Initial State (Vacuous Uncertainty m(Θ)=1.0)
    
    NORMAL --> NORMAL : Auth Operations<br/>m(U) < 0.60, K < 0.50
    
    NORMAL --> RESTRICTED : Violation / Conflict<br/>m(U) ≥ 0.60 OR K ≥ 0.50
    
    NORMAL --> CRITICAL : Severe Violation<br/>m(U) ≥ 0.85 OR K ≥ 0.80
    
    RESTRICTED --> RESTRICTED : Minor Violations<br/>m(U) < 0.85, K < 0.80
    
    RESTRICTED --> CRITICAL : Accumulated Violations<br/>m(U) ≥ 0.85 OR K ≥ 0.80
    
    CRITICAL --> CRITICAL : Fail Closed<br/>All Authority Revoked

    note right of RESTRICTED
        Action: WRITE_FILE, NETWORK, EXECUTE revoked.
        Read-only access retained.
    end note

    note right of CRITICAL
        Action: ALL capabilities revoked.
        ISOLATION_REQUESTED raised.
        Container shutdown triggered.
    end note
```

---

## 5. Phase 9 Showcase Sequence Flow

```mermaid
timeline
    title AEGIS-AI Phase 9 Showcase Sequence
    Step 1 : RESET : Database schema & workspace outputs reset to clean baseline
    Step 2 & 3 : Task Setup : SHOWCASE-AGENT-001 created; READ_FILE & WRITE_FILE capabilities granted
    Step 4 : Legitimate Task : READ research.txt & WRITE summary.txt succeed; summary file physically created; State NORMAL
    Step 5 : Unauth NETWORK : NETWORK probe DENIED; D-S Conflict K=0.5619 ≥ 0.50 triggers RESTRICTED; WRITE revoked
    Step 6 : Unauth File : READ private/credentials.env DENIED; D-S evidence fused; State RESTRICTED
    Step 7 : Post-Revocation Test : WRITE summary.txt attempt physically DENIED with CAPABILITY_REVOKED
    Step 8 : Severe Violation : EXECUTE malicious script DENIED with repeated=True; State CRITICAL; ALL revoked
    Step 9 : Containment : Isolation Required=True; ISOLATION_REQUESTED logged; logical revocation verified
    Step 10 : Audit Reconstruction : Persisted audit log verified (0 active caps, 2 revoked caps, 6 evidence events)
```
