"""Unit test: Dempster combination rule and conflict calculation."""
import pytest

from backend.trust_engine.dempster_shafer import (
    DempsterShaferEngine,
    TotalConflictError,
)
from backend.trust_engine.mass_function import (
    InvalidMassFunction,
    MassFunction,
)


def test_mass_function_requires_sum_of_one():
    with pytest.raises(InvalidMassFunction):
        MassFunction(
            trustworthy=0.80,
            untrustworthy=0.40,
            uncertainty=0.20,
        )


def test_vacuous_mass_represents_complete_uncertainty():
    mass = MassFunction.vacuous()

    assert mass.trustworthy == 0.0
    assert mass.untrustworthy == 0.0
    assert mass.uncertainty == 1.0


def test_vacuous_evidence_is_identity():
    engine = DempsterShaferEngine()

    unknown = MassFunction.vacuous()

    evidence = MassFunction(
        trustworthy=0.10,
        untrustworthy=0.60,
        uncertainty=0.30,
    )

    result = engine.combine(
        unknown,
        evidence,
    )

    assert result.mass.trustworthy == pytest.approx(0.10)
    assert result.mass.untrustworthy == pytest.approx(0.60)
    assert result.mass.uncertainty == pytest.approx(0.30)
    assert result.conflict == pytest.approx(0.0)


def test_project_worked_example():
    engine = DempsterShaferEngine()

    denied_network = MassFunction(
        trustworthy=0.10,
        untrustworthy=0.60,
        uncertainty=0.30,
    )

    denied_private_file = MassFunction(
        trustworthy=0.05,
        untrustworthy=0.70,
        uncertainty=0.25,
    )

    result = engine.combine(
        denied_network,
        denied_private_file,
    )

    assert result.conflict == pytest.approx(
        0.10,
        abs=1e-9,
    )

    assert result.mass.trustworthy == pytest.approx(
        0.05,
        abs=1e-9,
    )

    assert result.mass.untrustworthy == pytest.approx(
        0.8666666667,
        abs=1e-9,
    )

    assert result.mass.uncertainty == pytest.approx(
        0.0833333333,
        abs=1e-9,
    )


def test_combined_mass_still_sums_to_one():
    engine = DempsterShaferEngine()

    first = MassFunction(
        trustworthy=0.75,
        untrustworthy=0.05,
        uncertainty=0.20,
    )

    second = MassFunction(
        trustworthy=0.10,
        untrustworthy=0.60,
        uncertainty=0.30,
    )

    result = engine.combine(first, second)

    total = (
        result.mass.trustworthy
        + result.mass.untrustworthy
        + result.mass.uncertainty
    )

    assert total == pytest.approx(1.0)


def test_total_conflict_is_rejected():
    engine = DempsterShaferEngine()

    completely_trustworthy = MassFunction(
        trustworthy=1.0,
        untrustworthy=0.0,
        uncertainty=0.0,
    )

    completely_untrustworthy = MassFunction(
        trustworthy=0.0,
        untrustworthy=1.0,
        uncertainty=0.0,
    )

    with pytest.raises(TotalConflictError):
        engine.combine(
            completely_trustworthy,
            completely_untrustworthy,
        )