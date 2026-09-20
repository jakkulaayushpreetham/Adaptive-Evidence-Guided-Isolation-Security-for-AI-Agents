"""
experiments/experiment_runner.py
────────────────────────────────
Reusable harness for building one isolated AEGIS-AI security runtime
per experiment run.

Design
------
* Each run gets a fresh CapabilityStore, TrustState, and security
  runtime — no state leaks between runs or scenarios.
* The harness records exactly when detection and revocation boundaries
  are crossed (separate stopwatches, per the spec).
* Trajectory rows are accumulated so Phase 10 can plot them directly.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from backend.capability.capability import Capability, CapabilityStatus, Operation
from backend.capability.capability_manager import CapabilityManager
from backend.capability.capability_store import CapabilityStore
from backend.monitoring.security_event import SecurityEvent
from backend.policy.policy_engine import AdaptivePolicyEngine
from backend.policy.security_states import SecurityState
from backend.policy.thresholds import PolicyThresholds
from backend.reference_monitor.monitor import ReferenceMonitor
from backend.revocation.revocation_controller import RevocationController
from backend.revocation.isolation_manager import IsolationManager
from backend.runtime.security_runtime import SecurityRuntime, RuntimeResult
from backend.services.audit_sink import InMemoryAuditSink
from backend.trust_engine.dempster_shafer import DempsterShaferEngine
from backend.trust_engine.evidence_mapper import EvidenceMapper
from backend.trust_engine.trust_state import TrustState

from experiments.experiment_config import ExperimentConfig, DEFAULT_CONFIG
from experiments.metrics import (
    ExperimentRecord,
    Stopwatch,
    TrustTrajectoryRow,
)


# ─────────────────────────────────────────────────────────────────────
# Lightweight harness for one isolated scenario run
# ─────────────────────────────────────────────────────────────────────

@dataclass
class RunContext:
    """
    A single isolated run environment.

    Call .evaluate() for each agent operation. Access .runtime,
    .store, etc. directly for advanced scenarios.
    """

    agent_id: str
    task_id: str
    runtime: SecurityRuntime
    store: CapabilityStore
    manager: CapabilityManager
    audit_sink: InMemoryAuditSink
    trajectory: list[TrustTrajectoryRow] = field(default_factory=list)
    _event_index: int = field(default=0, init=False)

    def evaluate(
        self,
        operation: Operation,
        resource: str,
        repeated: bool = False,
    ) -> RuntimeResult:
        result = self.runtime.evaluate(
            agent_id=self.agent_id,
            task_id=self.task_id,
            operation=operation,
            resource=resource,
            repeated=repeated,
        )

        # Snapshot trajectory row after every operation
        trust = self.runtime.get_trust_state(
            agent_id=self.agent_id,
            task_id=self.task_id,
        )
        active_caps = len(
            [c for c in self.store.find_for_task(self.agent_id, self.task_id)
             if c.status is CapabilityStatus.ACTIVE]
        )
        self.trajectory.append(TrustTrajectoryRow(
            scenario="",  # filled in by the experiment
            run_id=0,
            event_index=self._event_index,
            event_type=operation.value,
            decision=result.authorization.decision.value,
            m_t=round(trust.trustworthy, 4),
            m_u=round(trust.untrustworthy, 4),
            m_theta=round(trust.uncertainty, 4),
            conflict_k=round(trust.last_conflict, 4),
            security_state=result.security_state.name,
            active_capability_count=active_caps,
        ))
        self._event_index += 1
        return result

    def grant(
        self,
        operation: Operation,
        resource: str,
    ) -> Capability:
        cap = self.manager.grant(
            agent_id=self.agent_id,
            task_id=self.task_id,
            operation=operation,
            resource=resource,
        )
        self.audit_sink.record_capability_grant(cap)
        return cap

    def active_capability_count(self) -> int:
        return len([
            c for c in self.store.find_for_task(self.agent_id, self.task_id)
            if c.status is CapabilityStatus.ACTIVE
        ])

    def revoked_capability_count(self) -> int:
        return len([
            c for c in self.store.find_for_task(self.agent_id, self.task_id)
            if c.status is CapabilityStatus.REVOKED
        ])


def build_run_context(config: ExperimentConfig = DEFAULT_CONFIG) -> RunContext:
    """
    Construct a completely fresh, isolated run environment.

    Policy thresholds are taken directly from config so threshold
    sweep experiments can override them without touching the singleton.
    """
    agent_id = f"EXP-AGT-{uuid.uuid4().hex[:8].upper()}"
    task_id = f"EXP-TASK-{uuid.uuid4().hex[:8].upper()}"

    thresholds = PolicyThresholds(
        restricted_untrustworthy=config.restriction_threshold,
        critical_untrustworthy=config.critical_threshold,
        high_conflict=config.high_conflict_threshold,
        critical_conflict=config.critical_conflict_threshold,
    )

    store = CapabilityStore()
    manager = CapabilityManager(store)
    monitor = ReferenceMonitor(store)
    evidence_mapper = EvidenceMapper()
    ds_engine = DempsterShaferEngine()
    policy_engine = AdaptivePolicyEngine(thresholds=thresholds)
    revocation_controller = RevocationController(manager)
    audit_sink = InMemoryAuditSink()

    runtime = SecurityRuntime(
        reference_monitor=monitor,
        evidence_mapper=evidence_mapper,
        ds_engine=ds_engine,
        policy_engine=policy_engine,
        revocation_controller=revocation_controller,
        isolation_manager=None,  # No Docker in unit experiments
        audit_sink=audit_sink,
    )

    return RunContext(
        agent_id=agent_id,
        task_id=task_id,
        runtime=runtime,
        store=store,
        manager=manager,
        audit_sink=audit_sink,
    )


# ─────────────────────────────────────────────────────────────────────
# Generic repeated-run harness
# ─────────────────────────────────────────────────────────────────────

ScenarioFn = Callable[[RunContext, int], ExperimentRecord]


def run_scenario(
    scenario_fn: ScenarioFn,
    scenario_name: str,
    *,
    config: ExperimentConfig = DEFAULT_CONFIG,
    verbose: bool = True,
) -> list[ExperimentRecord]:
    """
    Execute scenario_fn for warm_up_runs + measured_runs.

    Returns only the measured records (warm-up excluded from results).
    Prints a one-line summary per run when verbose=True.
    """
    all_records: list[ExperimentRecord] = []

    total = config.warm_up_runs + config.measured_runs

    for i in range(total):
        is_warmup = i < config.warm_up_runs
        run_id = i - config.warm_up_runs  # negative for warm-up

        ctx = build_run_context(config)

        with Stopwatch() as sw:
            record = scenario_fn(ctx, run_id)

        # Override execution_time with the harness-measured wall time
        # (scenario may also set it internally via Stopwatch for sub-ops)
        if record.execution_time_ms == 0.0:
            record.execution_time_ms = round(sw.elapsed_ms, 4)

        # Tag scenario name and run id
        record.scenario = scenario_name
        if is_warmup:
            record.run_id = run_id  # negative
            if verbose:
                print(f"  [WARMUP {i + 1}/{config.warm_up_runs}] "
                      f"state={record.final_state} "
                      f"m(U)={record.final_m_u:.3f} "
                      f"exec={record.execution_time_ms:.2f}ms")
        else:
            record.run_id = run_id
            all_records.append(record)
            if verbose:
                print(f"  [RUN {run_id + 1:02d}/{config.measured_runs}] "
                      f"state={record.final_state} "
                      f"blocked={record.unauthorized_blocked}/"
                      f"{record.unauthorized_attempts} "
                      f"m(U)={record.final_m_u:.3f} "
                      f"K={record.maximum_conflict:.3f} "
                      f"exec={record.execution_time_ms:.2f}ms")

    return all_records
