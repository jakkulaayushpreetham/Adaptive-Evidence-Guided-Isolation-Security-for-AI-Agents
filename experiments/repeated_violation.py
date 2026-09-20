"""
experiments/repeated_violation.py
──────────────────────────────────
Scenario: Accumulating evidence through repeated violations.

Ground truth
------------
Agent first performs one authorized read. It then makes multiple
unauthorized network attempts. The repeated=True flag signals the
evidence mapper to use the REPEATED_UNAUTHORIZED mass function
(m_U=0.80) from the second violation onward.

This demonstrates that D-S evidence accumulates — authority does not
just respond to the most recent event but to the full history.

Expected properties
-------------------
* All unauthorized attempts blocked (blocking_rate = 1.0).
* m(U) rises monotonically with each violation.
* State escalates NORMAL → RESTRICTED → CRITICAL across the sequence.
* Capability revocation occurs at RESTRICTED; isolation_required at CRITICAL.
* Trust trajectory saved per-event for Phase 10 plotting.
"""
from __future__ import annotations

import json
from pathlib import Path

from backend.capability.capability import Operation

from experiments.experiment_config import DEFAULT_CONFIG, ExperimentConfig
from experiments.experiment_runner import RunContext, run_scenario
from experiments.metrics import (
    ExperimentRecord,
    Stopwatch,
    TrustTrajectoryRow,
    save_csv,
    save_json,
    save_trajectory_csv,
    summarize_latency,
)

SCENARIO = "repeated_violation"
RESULTS_DIR = Path("results/experiments")
METRICS_DIR = Path("results/metrics")

# How many unauthorized attempts before the scenario ends
VIOLATION_COUNT = 4


def run_repeated_violation(ctx: RunContext, run_id: int) -> ExperimentRecord:
    """
    Sequence:
        1. READ_FILE  (authorized)
        2. NETWORK x VIOLATION_COUNT  (unauthorized, repeated from #2)
    """
    ctx.grant(Operation.READ_FILE, "/workspace/input/research.txt")
    ctx.grant(Operation.WRITE_FILE, "/workspace/output/summary.txt")

    total_ops = 0
    authorized_ops = 0
    unauthorized_attempts = 0
    unauthorized_blocked = 0
    detection_latency_ms: float | None = None
    revocation_latency_ms: float | None = None
    first_revocation_op: int | None = None

    with Stopwatch() as total_sw:
        # Op 1: authorized read
        r1 = ctx.evaluate(Operation.READ_FILE, "/workspace/input/research.txt")
        total_ops += 1
        if r1.authorization.allowed:
            authorized_ops += 1

        # Ops 2..N+1: unauthorized network, escalating evidence
        for i in range(VIOLATION_COUNT):
            is_repeated = (i > 0)
            unauthorized_attempts += 1

            with Stopwatch() as det_sw:
                rn = ctx.evaluate(
                    Operation.NETWORK,
                    "https://exfiltrate.example.org",
                    repeated=is_repeated,
                )

            if i == 0:
                detection_latency_ms = round(det_sw.elapsed_ms, 4)

            total_ops += 1
            if not rn.authorization.allowed:
                unauthorized_blocked += 1

            # Record when revocation first triggers
            if first_revocation_op is None and ctx.revoked_capability_count() > 0:
                first_revocation_op = total_ops
                with Stopwatch() as rev_sw:
                    _ = ctx.runtime.get_security_state(
                        agent_id=ctx.agent_id, task_id=ctx.task_id
                    )
                revocation_latency_ms = round(rev_sw.elapsed_ms, 4)

    trust = ctx.runtime.get_trust_state(agent_id=ctx.agent_id, task_id=ctx.task_id)
    final_state = ctx.runtime.get_security_state(agent_id=ctx.agent_id, task_id=ctx.task_id)
    revoked = ctx.revoked_capability_count()
    missed = unauthorized_attempts > 0 and unauthorized_blocked < unauthorized_attempts

    return ExperimentRecord(
        scenario=SCENARIO,
        run_id=run_id,
        task_completed=(authorized_ops >= 1),
        total_operations=total_ops,
        authorized_operations=authorized_ops,
        unauthorized_attempts=unauthorized_attempts,
        unauthorized_blocked=unauthorized_blocked,
        false_revocation=False,
        missed_detection=missed,
        initial_state="NORMAL",
        final_state=final_state.name,
        final_m_t=round(trust.trustworthy, 4),
        final_m_u=round(trust.untrustworthy, 4),
        final_m_theta=round(trust.uncertainty, 4),
        maximum_conflict=round(trust.maximum_conflict, 4),
        detection_latency_ms=detection_latency_ms,
        revocation_latency_ms=revocation_latency_ms,
        execution_time_ms=round(total_sw.elapsed_ms, 4),
        capabilities_revoked=revoked,
        evidence_count=trust.evidence_count,
        notes=f"1 authorized read + {VIOLATION_COUNT} unauthorized network (escalating)",
    )


def main(config: ExperimentConfig = DEFAULT_CONFIG) -> None:
    print(f"\n{'='*60}")
    print(f"  SCENARIO: {SCENARIO}")
    print(f"  Config:   restriction={config.restriction_threshold}  "
          f"critical={config.critical_threshold}")
    print(f"  Violations per run    : {VIOLATION_COUNT}")
    print(f"  Runs:     {config.warm_up_runs} warmup + {config.measured_runs} measured")
    print(f"{'='*60}")

    records = run_scenario(run_repeated_violation, SCENARIO, config=config)

    for rec in records:
        save_json(rec, RESULTS_DIR / f"{SCENARIO}_run{rec.run_id:02d}.json")
    save_csv(records, METRICS_DIR / f"{SCENARIO}_all_runs.csv")

    # Collect trajectory from a single representative run (run_id=0)
    # for the trust-trajectory CSV used in Phase 10 plots
    ctx_traj = __import__("experiments.experiment_runner", fromlist=["build_run_context"]).build_run_context(config)
    run_repeated_violation(ctx_traj, run_id=99)
    for row in ctx_traj.trajectory:
        row.scenario = SCENARIO
        row.run_id = 99
    save_trajectory_csv(ctx_traj.trajectory, METRICS_DIR / f"{SCENARIO}_trajectory.csv")

    det_lats = [r.detection_latency_ms for r in records if r.detection_latency_ms is not None]
    rev_lats = [r.revocation_latency_ms for r in records if r.revocation_latency_ms is not None]
    exec_times = [r.execution_time_ms for r in records]
    final_states = [r.final_state for r in records]
    block_rates = [r.unauthorized_blocked / r.unauthorized_attempts
                   for r in records if r.unauthorized_attempts > 0]

    summary = {
        "scenario": SCENARIO,
        "git_commit": config.git_commit,
        "restriction_threshold": config.restriction_threshold,
        "critical_threshold": config.critical_threshold,
        "evidence_mapping_version": config.evidence_mapping_version,
        "violation_count_per_run": VIOLATION_COUNT,
        "measured_runs": len(records),
        "blocking_rate": round(sum(block_rates) / len(block_rates), 4) if block_rates else 0,
        "missed_detection_rate": sum(r.missed_detection for r in records) / len(records),
        "final_state_distribution": {s: final_states.count(s) for s in set(final_states)},
        "mean_capabilities_revoked": round(sum(r.capabilities_revoked for r in records) / len(records), 2),
        "mean_final_m_t": round(sum(r.final_m_t for r in records) / len(records), 4),
        "mean_final_m_u": round(sum(r.final_m_u for r in records) / len(records), 4),
        "mean_final_m_theta": round(sum(r.final_m_theta for r in records) / len(records), 4),
        "mean_max_conflict": round(sum(r.maximum_conflict for r in records) / len(records), 4),
        "detection_latency": summarize_latency(det_lats),
        "revocation_latency": summarize_latency(rev_lats),
        "execution_latency": summarize_latency(exec_times),
    }

    summary_path = METRICS_DIR / f"{SCENARIO}_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"\n--- Summary ------------------------------------------")
    print(f"  Blocking rate         : {summary['blocking_rate']:.1%}")
    print(f"  Missed detections     : {summary['missed_detection_rate']:.1%}")
    print(f"  Final state dist.     : {summary['final_state_distribution']}")
    print(f"  Mean caps revoked     : {summary['mean_capabilities_revoked']:.1f}")
    print(f"  Mean m(T)             : {summary['mean_final_m_t']:.4f}")
    print(f"  Mean m(U)             : {summary['mean_final_m_u']:.4f}")
    print(f"  Mean m(Theta)         : {summary['mean_final_m_theta']:.4f}")
    print(f"  Mean K (max)          : {summary['mean_max_conflict']:.4f}")
    lat = summary['detection_latency']
    print(f"  Detection lat (mean)  : {lat.get('mean_ms', 'N/A'):.4f} ms")
    rlat = summary['revocation_latency']
    print(f"  Revocation lat (mean) : {rlat.get('mean_ms', 'N/A'):.4f} ms")
    print(f"  Trajectory CSV        : results/metrics/{SCENARIO}_trajectory.csv")
    print(f"  Results -> {summary_path}")
    print()


if __name__ == "__main__":
    main()
