from __future__ import annotations

from dataclasses import dataclass

from backend.capability.capability import Operation
from backend.capability.capability_scope import normalize_resource


@dataclass(frozen=True, slots=True)
class CapabilityProposal:
    operation: Operation
    resource: str


class PolicyViolation(ValueError):
    pass


class PolicyValidator:

    SAFE_READ_PREFIX = "/workspace/input/"
    SAFE_WRITE_PREFIX = "/workspace/output/"

    def validate(
        self,
        proposal: CapabilityProposal,
    ) -> CapabilityProposal:

        resource = normalize_resource(proposal.resource)

        if proposal.operation is Operation.READ_FILE:
            if not resource.startswith(self.SAFE_READ_PREFIX):
                raise PolicyViolation(
                    "READ_FILE is restricted to the task input workspace."
                )

        elif proposal.operation is Operation.WRITE_FILE:
            if not resource.startswith(self.SAFE_WRITE_PREFIX):
                raise PolicyViolation(
                    "WRITE_FILE is restricted to the task output workspace."
                )

        elif proposal.operation in {
            Operation.EXECUTE,
            Operation.DELETE_FILE,
        }:
            raise PolicyViolation(
                f"{proposal.operation.value} is denied by default."
            )

        return CapabilityProposal(
            operation=proposal.operation,
            resource=resource,
        )