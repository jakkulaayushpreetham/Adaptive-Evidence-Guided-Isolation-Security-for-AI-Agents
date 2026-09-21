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

    SAFE_READ_PREFIXES = (
        "/workspace/input/",
        "/workspace/config/",
        "/workspace/cache/",
        "/workspace/data/",
    )
    SAFE_WRITE_PREFIXES = (
        "/workspace/output/",
        "/workspace/cache/",
    )

    BLOCKED_PATTERNS = (
        ".env",
        "/root/",
        "/etc/",
        "id_rsa",
        "shadow",
        "credentials.env",
    )

    def validate(
        self,
        proposal: CapabilityProposal,
    ) -> CapabilityProposal:

        resource = normalize_resource(proposal.resource)

        # Block any explicit credential or host system probing
        for pattern in self.BLOCKED_PATTERNS:
            if pattern in resource:
                raise PolicyViolation(
                    f"Access to sensitive host or credential resource '{pattern}' is forbidden."
                )

        if proposal.operation is Operation.READ_FILE:
            if not any(resource.startswith(prefix) for prefix in self.SAFE_READ_PREFIXES):
                raise PolicyViolation(
                    f"READ_FILE is restricted to authorized task workspaces ({', '.join(self.SAFE_READ_PREFIXES)})."
                )

        elif proposal.operation is Operation.WRITE_FILE:
            if not any(resource.startswith(prefix) for prefix in self.SAFE_WRITE_PREFIXES):
                raise PolicyViolation(
                    f"WRITE_FILE is restricted to authorized task workspaces ({', '.join(self.SAFE_WRITE_PREFIXES)})."
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