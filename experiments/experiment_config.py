"""
experiments/experiment_config.py
─────────────────────────────────
Single source of truth for all experimental parameters.

These values are prototype policy parameters, NOT Dempster-Shafer
constants. The threshold_sweep experiment evaluates alternative
configurations against the scenario suite explicitly.
"""
from __future__ import annotations

import subprocess
from dataclasses import asdict, dataclass, field
from pathlib import Path


def _git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL,
            cwd=Path(__file__).parent.parent,
        ).decode().strip()
    except Exception:
        return "unknown"


@dataclass(frozen=True, slots=True)
class ExperimentConfig:
    """
    Immutable experimental configuration.

    Write every results file alongside the config that produced it.
    Never tune thresholds mid-experiment without recording a new commit.
    """

    # ── Timing ────────────────────────────────────────────────────────
    warm_up_runs: int = 5
    measured_runs: int = 30

    # ── Policy thresholds (configurable — not D-S constants) ──────────
    restriction_threshold: float = 0.60   # m(U) ≥ this → RESTRICTED
    critical_threshold: float = 0.85      # m(U) ≥ this → CRITICAL
    high_conflict_threshold: float = 0.50 # K ≥ this    → RESTRICTED
    critical_conflict_threshold: float = 0.80  # K ≥ this → CRITICAL

    # ── Evidence mapping version (bump when mass assignments change) ──
    evidence_mapping_version: str = "v1"

    # ── Evidence masses (prototype calibration parameters) ────────────
    mass_authorized_t: float = 0.75
    mass_authorized_u: float = 0.05
    mass_authorized_theta: float = 0.20

    mass_unauth_network_t: float = 0.10
    mass_unauth_network_u: float = 0.60
    mass_unauth_network_theta: float = 0.30

    mass_unauth_file_t: float = 0.05
    mass_unauth_file_u: float = 0.70
    mass_unauth_file_theta: float = 0.25

    mass_repeated_unauth_t: float = 0.05
    mass_repeated_unauth_u: float = 0.80
    mass_repeated_unauth_theta: float = 0.15

    # ── Provenance ────────────────────────────────────────────────────
    git_commit: str = field(default_factory=_git_commit)
    docker_verified: bool = False

    def as_dict(self) -> dict:
        return asdict(self)


# Default configuration used by all experiments unless overridden.
DEFAULT_CONFIG = ExperimentConfig()
