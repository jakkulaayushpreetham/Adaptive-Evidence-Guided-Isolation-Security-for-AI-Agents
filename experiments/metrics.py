"""
experiments/metrics.py
──────────────────────
Standardised measurement primitives for all AEGIS-AI experiments.

Key design decisions
--------------------
* perf_counter_ns() for latency — not wall-clock datetime differences.
* ExperimentRecord is the canonical per-run data structure.
* save_json / save_csv write raw data; no post-hoc editing.
* Stopwatch is a context manager for exactly-bounded timing regions.
"""
from __future__ import annotations

import csv
import json
import statistics
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterator


# ─────────────────────────────────────────────────────────────────────
# Canonical per-run record
# ─────────────────────────────────────────────────────────────────────

@dataclass(slots=True)
class ExperimentRecord:
    """
    One measured run of one scenario.

    Fields match the Phase 8 specification exactly so CSV headers
    are consistent across all exported tables.
    """

    scenario: str
    run_id: int

    # Task outcome
    task_completed: bool
    total_operations: int
    authorized_operations: int
    unauthorized_attempts: int
    unauthorized_blocked: int

    # False-positive / false-negative flags
    false_revocation: bool
    missed_detection: bool

    # Security state
    initial_state: str
    final_state: str

    # D-S mass at end of run
    final_m_t: float
    final_m_u: float
    final_m_theta: float
    maximum_conflict: float

    # Latency (ms) — None when not applicable to the scenario
    detection_latency_ms: float | None
    revocation_latency_ms: float | None
    execution_time_ms: float

    # Additional counters
    capabilities_revoked: int = 0
    evidence_count: int = 0
    notes: str = ""


# ─────────────────────────────────────────────────────────────────────
# Derived metrics
# ─────────────────────────────────────────────────────────────────────

def blocked_rate(record: ExperimentRecord) -> float:
    """Fraction of unauthorized attempts that were blocked."""
    if record.unauthorized_attempts == 0:
        return 1.0
    return record.unauthorized_blocked / record.unauthorized_attempts


def false_revocation_rate(records: list[ExperimentRecord]) -> float:
    """
    Rate across legitimate-scenario runs where required privilege
    was incorrectly revoked.

    FRR = |{r : r.false_revocation}| / |records|
    """
    if not records:
        return 0.0
    return sum(1 for r in records if r.false_revocation) / len(records)


# ─────────────────────────────────────────────────────────────────────
# Persistence helpers
# ─────────────────────────────────────────────────────────────────────

def save_json(record: ExperimentRecord, output: Path) -> None:
    """Write a single record as pretty-printed JSON."""
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(asdict(record), indent=2, default=str),
        encoding="utf-8",
    )


def append_json_list(record: ExperimentRecord, output: Path) -> None:
    """
    Append a record to a JSON-lines file (one JSON object per line).
    Safe for incremental writes during a long experiment run.
    """
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(asdict(record), default=str) + "\n")


def save_csv(records: list[ExperimentRecord], output: Path) -> None:
    """Write a list of records as CSV."""
    if not records:
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(asdict(records[0]).keys()))
        writer.writeheader()
        for rec in records:
            writer.writerow(asdict(rec))


# ─────────────────────────────────────────────────────────────────────
# Latency / overhead summaries
# ─────────────────────────────────────────────────────────────────────

def summarize_latency(values: list[float]) -> dict[str, float]:
    """
    Return descriptive statistics for a latency distribution.
    Input values must already exclude warm-up runs.
    """
    if not values:
        return {}
    ordered = sorted(values)
    n = len(ordered)
    return {
        "n": n,
        "mean_ms": round(statistics.mean(ordered), 4),
        "median_ms": round(statistics.median(ordered), 4),
        "stdev_ms": round(statistics.stdev(ordered) if n > 1 else 0.0, 4),
        "min_ms": round(min(ordered), 4),
        "max_ms": round(max(ordered), 4),
        "p95_ms": round(ordered[min(n - 1, int(0.95 * n))], 4),
    }


def compute_overhead(
    baseline_ms: list[float],
    aegis_ms: list[float],
) -> dict[str, float]:
    """
    Compare baseline vs AEGIS-enforced latency distributions.

    Overhead_ms  = mean(AEGIS) - mean(baseline)
    Overhead_%   = (mean(AEGIS) - mean(baseline)) / mean(baseline) × 100
    """
    if not baseline_ms or not aegis_ms:
        return {}
    b = statistics.mean(baseline_ms)
    a = statistics.mean(aegis_ms)
    overhead_ms = a - b
    overhead_pct = (overhead_ms / b * 100) if b > 0 else float("inf")
    return {
        "baseline_mean_ms": round(b, 4),
        "aegis_mean_ms": round(a, 4),
        "overhead_ms": round(overhead_ms, 4),
        "overhead_pct": round(overhead_pct, 2),
    }


# ─────────────────────────────────────────────────────────────────────
# Trust trajectory row (saved per-event for chart/table generation)
# ─────────────────────────────────────────────────────────────────────

@dataclass(slots=True)
class TrustTrajectoryRow:
    scenario: str
    run_id: int
    event_index: int
    event_type: str
    decision: str
    m_t: float
    m_u: float
    m_theta: float
    conflict_k: float
    security_state: str
    active_capability_count: int


def save_trajectory_csv(rows: list[TrustTrajectoryRow], output: Path) -> None:
    """Write D-S trust trajectory rows to CSV."""
    if not rows:
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(asdict(rows[0]).keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row))


# ─────────────────────────────────────────────────────────────────────
# Precision timing context manager
# ─────────────────────────────────────────────────────────────────────

class Stopwatch:
    """
    Context manager for precise latency measurement.

    Uses perf_counter_ns() — monotonic, not wall-clock.

    Usage::

        with Stopwatch() as sw:
            do_work()
        print(sw.elapsed_ms)
    """

    def __enter__(self) -> "Stopwatch":
        self._start_ns: int = time.perf_counter_ns()
        return self

    def __exit__(self, *_) -> None:
        self._end_ns: int = time.perf_counter_ns()

    @property
    def elapsed_ms(self) -> float:
        return (self._end_ns - self._start_ns) / 1_000_000
