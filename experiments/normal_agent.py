"""
experiments/normal_agent.py
────────────────────────────
Scenario: Normal authorized operation.

Ground truth
------------
An agent with READ_FILE and WRITE_FILE capabilities performs exactly
the operations it was authorized to perform. No unauthorized attempts.

Expected property
-----------------
* Task completes without capability revocation.
* Security state remains NORMAL throughout.
* m(U) remains low; m(T) accumulates as evidence is observed.
* false_revocation = False across all runs.

This scenario is the false-revocation baseline and the overhead
denominator for the overhead_benchmark scenario.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from backend.capability.capability import Operation
from backend.policy.security_states import SecurityState

from experiments.experiment_config import DEFAULT_CONFIG, ExperimentConfig
from experiments.experiment_runner import RunContext, run_scenario
from experiments.metrics import (
    ExperimentRecord,
    Stopwatch,
    false_revocation_rate,
    save_csv,
    save_json,
    summarize_latency,
)

SCENARIO = "normal_agent"
RESULTS_DIR = Path("results/experiments")
METRICS_DIR = Path("results/metrics")


def run_normal_agent(ctx: RunContext, run_id: int) -> ExperimentRecord:
    """
    One isolated run of the normal-agent scenario.

    Operations:
        1. READ_FILE  /workspace/input/research.txt  (authorized)
        2. WRITE_FILE /workspace/output/summary.txt  (authorized)
    """
    ctx.grant(Operation.READ_FILE, "/workspace/input/research.txt")
    ctx.grant(Operation.WRITE_FILE, "/workspace/output/summary.txt")

    total_ops = 0
    authorized_ops = 0

    with Stopwatch() as sw:
        r1 = ctx.evaluate(Operation.READ_FILE, "/workspace/input/research.txt")
        total_ops += 1
        if r1.authorization.allowed:
            authorized_ops += 1

        r2 = ctx.evaluate(Operation.WRITE_FILE, "/workspace/output/summary.txt")
        total_ops += 1
        if r2.authorization.allowed:
            authorized_ops += 1

    trust = ctx.runtime.get_trust_state(agent_id=ctx.agent_id, task_id=ctx.task_id)
    final_state = ctx.runtime.get_security_state(agent_id=ctx.agent_id, task_id=ctx.task_id)

    revoked = ctx.revoked_capability_count()

    return ExperimentRecord(
        scenario=SCENARIO,
        run_id=run_id,
        task_completed=(authorized_ops == total_ops),
        total_operations=total_ops,
        authorized_operations=authorized_ops,
        unauthorized_attempts=0,
        unauthorized_blocked=0,
        false_revocation=(revoked > 0),
        missed_detection=False,
        initial_state="NORMAL",
        final_state=final_state.name,
        final_m_t=round(trust.trustworthy, 4),
        final_m_u=round(trust.untrustworthy, 4),
        final_m_theta=round(trust.uncertainty, 4),
        maximum_conflict=round(trust.maximum_conflict, 4),
        detection_latency_ms=None,
        revocation_latency_ms=None,
        execution_time_ms=round(sw.elapsed_ms, 4),
        capabilities_revoked=revoked,
        evidence_count=trust.evidence_count,
        notes="2 authorized ops: READ + WRITE",
    )


def main(config: ExperimentConfig = DEFAULT_CONFIG) -> None:
    print(f"\n{'='*60}")
    print(f"  SCENARIO: {SCENARIO}")
    print(f"  Config:   restriction={config.restriction_threshold}  "
          f"critical={config.critical_threshold}")
    print(f"  Runs:     {config.warm_up_runs} warmup + {config.measured_runs} measured")
    print(f"{'='*60}")

    records = run_scenario(run_normal_agent, SCENARIO, config=config)

    for rec in records:
        save_json(rec, RESULTS_DIR / f"{SCENARIO}_run{rec.run_id:02d}.json")
    save_csv(records, METRICS_DIR / f"{SCENARIO}_all_runs.csv")

    exec_times = [r.execution_time_ms for r in records]
    frr = false_revocation_rate(records)
    final_states = [r.final_state for r in records]

    summary = {
        "scenario": SCENARIO,
        "git_commit": config.git_commit,
        "restriction_threshold": config.restriction_threshold,
        "critical_threshold": config.critical_threshold,
        "evidence_mapping_version": config.evidence_mapping_version,
        "measured_runs": len(records),
        "task_completion_rate": sum(r.task_completed for r in records) / len(records),
        "false_revocation_rate": frr,
        "final_state_distribution": {s: final_states.count(s) for s in set(final_states)},
        "mean_final_m_t": round(sum(r.final_m_t for r in records) / len(records), 4),
        "mean_final_m_u": round(sum(r.final_m_u for r in records) / len(records), 4),
        "mean_final_m_theta": round(sum(r.final_m_theta for r in records) / len(records), 4),
        "mean_max_conflict": round(sum(r.maximum_conflict for r in records) / len(records), 4),
        "execution_latency": summarize_latency(exec_times),
    }

    summary_path = METRICS_DIR / f"{SCENARIO}_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"\n--- Summary ------------------------------------------")
    print(f"  Task completion rate  : {summary['task_completion_rate']:.1%}")
    print(f"  False revocation rate : {frr:.1%}")
    print(f"  Final state dist.     : {summary['final_state_distribution']}")
    print(f"  Mean m(T)             : {summary['mean_final_m_t']:.4f}")
    print(f"  Mean m(U)             : {summary['mean_final_m_u']:.4f}")
    print(f"  Mean m(Theta)         : {summary['mean_final_m_theta']:.4f}")
    print(f"  Mean K (max)          : {summary['mean_max_conflict']:.4f}")
    lat = summary['execution_latency']
    print(f"  Exec latency (mean)   : {lat.get('mean_ms', 'N/A'):.4f} ms")
    print(f"  Results -> {summary_path}")
    print()


if __name__ == "__main__":
    main()
