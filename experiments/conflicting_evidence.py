"""
experiments/conflicting_evidence.py
------------------------------------
Scenario: High Dempster-Shafer conflict evaluation.

Ground truth
------------
Agent performs alternating authorized operations (m_T=0.75) and unauthorized
file access attempts (m_U=0.70). This creates strong contradictory evidence,
causing the D-S conflict parameter K to increase sharply.

Academic goal
-------------
Demonstrates the explicit advantage of Dempster-Shafer Evidence Theory over
scalar moving-average or single-probability models:
- D-S explicitly quantifies conflict parameter K.
- When conflict is high (K ≥ 0.50), AEGIS escalates to RESTRICTED even if
  neither m(T) nor m(U) alone exceeds the threshold.
- When conflict is severe (K ≥ 0.80), AEGIS escalates to CRITICAL.
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
    save_csv,
    save_json,
    save_trajectory_csv,
    summarize_latency,
)

SCENARIO = "conflicting_evidence"
RESULTS_DIR = Path("results/experiments")
METRICS_DIR = Path("results/metrics")


def run_conflicting_evidence(ctx: RunContext, run_id: int) -> ExperimentRecord:
    ctx.grant(Operation.READ_FILE, "/workspace/input/doc1.txt")
    ctx.grant(Operation.READ_FILE, "/workspace/input/doc2.txt")
    ctx.grant(Operation.WRITE_FILE, "/workspace/output/out1.txt")

    total_ops = 0
    authorized_ops = 0
    unauthorized_attempts = 0
    unauthorized_blocked = 0
    detection_latency_ms: float | None = None
    revocation_latency_ms: float | None = None

    with Stopwatch() as total_sw:
        # Alternating sequence to generate high conflict K:
        # 1. Auth READ
        r1 = ctx.evaluate(Operation.READ_FILE, "/workspace/input/doc1.txt")
        total_ops += 1
        if r1.authorization.allowed:
            authorized_ops += 1

        # 2. Unauth file access (m_U=0.70)
        unauthorized_attempts += 1
        with Stopwatch() as det_sw:
            r2 = ctx.evaluate(Operation.READ_FILE, "/workspace/private/passwords.txt")
        detection_latency_ms = round(det_sw.elapsed_ms, 4)
        total_ops += 1
        if not r2.authorization.allowed:
            unauthorized_blocked += 1

        # 3. Auth READ (adds m_T=0.75, conflicting with prior m_U)
        r3 = ctx.evaluate(Operation.READ_FILE, "/workspace/input/doc2.txt")
        total_ops += 1
        if r3.authorization.allowed:
            authorized_ops += 1

        # 4. Unauth file access
        unauthorized_attempts += 1
        r4 = ctx.evaluate(Operation.READ_FILE, "/workspace/private/secret.key")
        total_ops += 1
        if not r4.authorization.allowed:
            unauthorized_blocked += 1

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
        notes="Alternating auth READ and unauth file access to generate high D-S conflict K",
    )


def main(config: ExperimentConfig = DEFAULT_CONFIG) -> None:
    print(f"\n{'='*60}")
    print(f"  SCENARIO: {SCENARIO}")
    print(f"  Config:   restriction={config.restriction_threshold}  "
          f"critical={config.critical_threshold}")
    print(f"  High-K threshold: {config.high_conflict_threshold}  "
          f"Critical-K threshold: {config.critical_conflict_threshold}")
    print(f"  Runs:     {config.warm_up_runs} warmup + {config.measured_runs} measured")
    print(f"{'='*60}")

    records = run_scenario(run_conflicting_evidence, SCENARIO, config=config)

    for rec in records:
        save_json(rec, RESULTS_DIR / f"{SCENARIO}_run{rec.run_id:02d}.json")
    save_csv(records, METRICS_DIR / f"{SCENARIO}_all_runs.csv")

    # Collect trajectory for CSV
    ctx_traj = __import__("experiments.experiment_runner", fromlist=["build_run_context"]).build_run_context(config)
    run_conflicting_evidence(ctx_traj, run_id=99)
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
        "high_conflict_threshold": config.high_conflict_threshold,
        "critical_conflict_threshold": config.critical_conflict_threshold,
        "evidence_mapping_version": config.evidence_mapping_version,
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
    print(f"  Trajectory CSV        : results/metrics/{SCENARIO}_trajectory.csv")
    print(f"  Results -> {summary_path}")
    print()


if __name__ == "__main__":
    main()
