"""
experiments/benchmark.py
-------------------------
Master Benchmark Runner for Phase 8 Evaluation.

Executes all 7 scenarios + threshold sweep + overhead benchmark in order,
aggregates all metric records, and generates canonical dataset files:

- results/metrics/all_runs.csv
- results/metrics/scenario_summary.csv
- results/metrics/latency_summary.csv
- results/metrics/run_config.json
- results/metrics/threshold_sweep.csv
- results/metrics/overhead_summary.json
"""
from __future__ import annotations

import csv
import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from experiments.accidental_violation import run_accidental_violation
from experiments.conflicting_evidence import run_conflicting_evidence
from experiments.experiment_config import DEFAULT_CONFIG, ExperimentConfig
from experiments.experiment_runner import run_scenario
from experiments.metrics import (
    ExperimentRecord,
    false_revocation_rate,
    save_csv,
    save_json,
    summarize_latency,
)
from experiments.normal_agent import run_normal_agent
from experiments.overhead_benchmark import run_overhead_benchmark
from experiments.repeated_violation import run_repeated_violation
from experiments.severe_violation import run_severe_violation
from experiments.threshold_sweep import run_threshold_sweep
from experiments.unauthorized_file import run_unauthorized_file
from experiments.unauthorized_network import run_unauthorized_network

RESULTS_DIR = Path("results/experiments")
METRICS_DIR = Path("results/metrics")


def run_full_benchmark(config: ExperimentConfig = DEFAULT_CONFIG) -> None:
    print(f"\n{'='*70}")
    print(f"  AEGIS-AI PHASE 8 EXPERIMENTAL EVALUATION SUITE")
    print(f"  Git Commit Provenance : {config.git_commit}")
    print(f"  Evidence Mapping Ver  : {config.evidence_mapping_version}")
    print(f"  Thresholds            : restriction={config.restriction_threshold}, critical={config.critical_threshold}")
    print(f"  Runs per scenario     : {config.warm_up_runs} warmup + {config.measured_runs} measured")
    print(f"{'='*70}\n")

    scenarios = [
        ("normal_agent", run_normal_agent),
        ("accidental_violation", run_accidental_violation),
        ("unauthorized_network", run_unauthorized_network),
        ("unauthorized_file", run_unauthorized_file),
        ("repeated_violation", run_repeated_violation),
        ("severe_violation", run_severe_violation),
        ("conflicting_evidence", run_conflicting_evidence),
    ]

    all_records: list[ExperimentRecord] = []
    scenario_summaries: list[dict] = []
    latency_summaries: list[dict] = []

    for scenario_name, runner in scenarios:
        print(f"Running {scenario_name} ...", end=" ", flush=True)
        records = run_scenario(runner, scenario_name, config=config)
        all_records.extend(records)

        # Save individual run files
        for rec in records:
            save_json(rec, RESULTS_DIR / f"{scenario_name}_run{rec.run_id:02d}.json")
        save_csv(records, METRICS_DIR / f"{scenario_name}_all_runs.csv")

        # Calculate metrics
        exec_times = [r.execution_time_ms for r in records]
        det_times = [r.detection_latency_ms for r in records if r.detection_latency_ms is not None]
        rev_times = [r.revocation_latency_ms for r in records if r.revocation_latency_ms is not None]
        final_states = [r.final_state for r in records]
        block_rates = [r.unauthorized_blocked / r.unauthorized_attempts
                       for r in records if r.unauthorized_attempts > 0]

        summary_row = {
            "scenario": scenario_name,
            "measured_runs": len(records),
            "task_completion_rate": round(sum(r.task_completed for r in records) / len(records), 4),
            "false_revocation_rate": round(false_revocation_rate(records), 4),
            "blocking_rate": round(sum(block_rates) / len(block_rates), 4) if block_rates else 1.0,
            "missed_detection_rate": round(sum(r.missed_detection for r in records) / len(records), 4),
            "mean_capabilities_revoked": round(sum(r.capabilities_revoked for r in records) / len(records), 2),
            "mean_final_m_t": round(sum(r.final_m_t for r in records) / len(records), 4),
            "mean_final_m_u": round(sum(r.final_m_u for r in records) / len(records), 4),
            "mean_final_m_theta": round(sum(r.final_m_theta for r in records) / len(records), 4),
            "mean_max_conflict": round(sum(r.maximum_conflict for r in records) / len(records), 4),
            "final_state_normal": final_states.count("NORMAL"),
            "final_state_restricted": final_states.count("RESTRICTED"),
            "final_state_critical": final_states.count("CRITICAL"),
        }
        scenario_summaries.append(summary_row)

        lat_row = {
            "scenario": scenario_name,
            "detection_mean_ms": summarize_latency(det_times).get("mean_ms"),
            "detection_p95_ms": summarize_latency(det_times).get("p95_ms"),
            "revocation_mean_ms": summarize_latency(rev_times).get("mean_ms"),
            "revocation_p95_ms": summarize_latency(rev_times).get("p95_ms"),
            "execution_mean_ms": summarize_latency(exec_times).get("mean_ms"),
            "execution_p95_ms": summarize_latency(exec_times).get("p95_ms"),
        }
        latency_summaries.append(lat_row)

        print("done.")

    # 1. Save all_runs.csv
    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    all_runs_path = METRICS_DIR / "all_runs.csv"
    save_csv(all_records, all_runs_path)

    # 2. Save scenario_summary.csv
    sec_summary_path = METRICS_DIR / "scenario_summary.csv"
    with sec_summary_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(scenario_summaries[0].keys()))
        writer.writeheader()
        writer.writerows(scenario_summaries)

    # 3. Save latency_summary.csv
    lat_summary_path = METRICS_DIR / "latency_summary.csv"
    with lat_summary_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(latency_summaries[0].keys()))
        writer.writeheader()
        writer.writerows(latency_summaries)

    # 4. Save run_config.json
    run_config = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "git_commit": config.git_commit,
        "evidence_mapping_version": config.evidence_mapping_version,
        "docker_verified": config.docker_verified,
        "restriction_threshold": config.restriction_threshold,
        "critical_threshold": config.critical_threshold,
        "high_conflict_threshold": config.high_conflict_threshold,
        "critical_conflict_threshold": config.critical_conflict_threshold,
        "warm_up_runs": config.warm_up_runs,
        "measured_runs": config.measured_runs,
        "scenarios_evaluated": [s[0] for s in scenarios],
        "total_experiment_records": len(all_records),
    }
    config_path = METRICS_DIR / "run_config.json"
    config_path.write_text(json.dumps(run_config, indent=2), encoding="utf-8")

    # 5. Run threshold sweep
    print("\nExecuting sensitivity threshold sweep ...")
    run_threshold_sweep()

    # 6. Run overhead benchmark
    print("\nExecuting runtime overhead benchmark ...")
    run_overhead_benchmark(config=config)

    # Print final summary table
    print(f"\n{'='*95}")
    print(f"  AEGIS-AI EXPERIMENTAL RESULTS SUMMARY TABLE")
    print(f"{'='*95}")
    print(f"{'Scenario':<24} {'Comp%':<8} {'FRR%':<8} {'Block%':<8} {'Mean m(U)':<10} {'Mean K':<8} {'Final Dist':<20}")
    print(f"{'-'*95}")
    for s in scenario_summaries:
        dist_str = f"N:{s['final_state_normal']} R:{s['final_state_restricted']} C:{s['final_state_critical']}"
        print(f"{s['scenario']:<24} {s['task_completion_rate']*100:<7.1f}% {s['false_revocation_rate']*100:<7.1f}% {s['blocking_rate']*100:<7.1f}% {s['mean_final_m_u']:<10.4f} {s['mean_max_conflict']:<8.4f} {dist_str:<20}")
    print(f"{'='*95}")
    print(f"\nCanonical results saved to:")
    print(f"  - {all_runs_path}")
    print(f"  - {sec_summary_path}")
    print(f"  - {lat_summary_path}")
    print(f"  - {config_path}")
    print()


def main() -> None:
    run_full_benchmark()


if __name__ == "__main__":
    main()
