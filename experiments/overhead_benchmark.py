"""
experiments/overhead_benchmark.py
----------------------------------
AEGIS Runtime Overhead Benchmark.

Compares operation latency between:
1. Baseline (direct operation execution without security pipeline)
2. AEGIS-enforced pipeline (Reference Monitor -> Evidence Mapper -> D-S Engine -> Adaptive Policy Engine -> Capability Store update)

Quantifies absolute security overhead (ms per operation) and percentage
overhead relative to baseline.
"""
from __future__ import annotations

import json
from pathlib import Path

from backend.capability.capability import Operation

from experiments.experiment_config import DEFAULT_CONFIG, ExperimentConfig
from experiments.experiment_runner import build_run_context
from experiments.metrics import Stopwatch, compute_overhead, summarize_latency

METRICS_DIR = Path("results/metrics")


def run_overhead_benchmark(config: ExperimentConfig = DEFAULT_CONFIG) -> dict:
    print(f"\n{'='*60}")
    print(f"  OVERHEAD BENCHMARK")
    print(f"  Runs: {config.warm_up_runs} warmup + {config.measured_runs} measured")
    print(f"{'='*60}")

    baseline_times_ms: list[float] = []
    aegis_times_ms: list[float] = []

    # Warmup runs
    for _ in range(config.warm_up_runs):
        # Baseline warmup
        with Stopwatch() as sw_base:
            # Simulate direct operation check
            _ = True
        # AEGIS warmup
        ctx = build_run_context(config)
        ctx.grant(Operation.READ_FILE, "/workspace/input/data.txt")
        with Stopwatch() as sw_aegis:
            ctx.evaluate(Operation.READ_FILE, "/workspace/input/data.txt")

    # Measured runs
    for run_id in range(1, config.measured_runs + 1):
        # Baseline run
        with Stopwatch() as sw_base:
            # Simulate direct operation check
            _ = True
        baseline_times_ms.append(sw_base.elapsed_ms)

        # AEGIS run
        ctx = build_run_context(config)
        ctx.grant(Operation.READ_FILE, "/workspace/input/data.txt")
        with Stopwatch() as sw_aegis:
            ctx.evaluate(Operation.READ_FILE, "/workspace/input/data.txt")
        aegis_times_ms.append(sw_aegis.elapsed_ms)

    base_lat = summarize_latency(baseline_times_ms)
    aegis_lat = summarize_latency(aegis_times_ms)

    base_mean = base_lat.get("mean_ms", 0.001)
    aegis_mean = aegis_lat.get("mean_ms", 0.0)

    ov = compute_overhead(baseline_times_ms, aegis_times_ms)

    summary = {
        "scenario": "overhead_benchmark",
        "git_commit": config.git_commit,
        "measured_runs": config.measured_runs,
        "baseline_latency": base_lat,
        "aegis_enforced_latency": aegis_lat,
        "overhead_ms": ov["overhead_ms"],
        "overhead_pct": ov["overhead_pct"],
        "notes": "Single READ_FILE operation: Baseline (direct check) vs AEGIS SecurityRuntime pipeline",
    }

    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    summary_path = METRICS_DIR / "overhead_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"\n--- Summary ------------------------------------------")
    print(f"  Baseline Latency (mean) : {base_mean:.4f} ms")
    print(f"  AEGIS Latency (mean)    : {aegis_mean:.4f} ms")
    print(f"  Absolute Overhead       : +{ov['overhead_ms']:.4f} ms / operation")
    print(f"  Relative Overhead       : +{ov['overhead_pct']:.1f}%")
    print(f"  Results -> {summary_path}")
    print()

    return summary


def main() -> None:
    run_overhead_benchmark()


if __name__ == "__main__":
    main()
