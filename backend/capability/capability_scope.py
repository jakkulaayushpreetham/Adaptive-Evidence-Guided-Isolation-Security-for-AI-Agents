from __future__ import annotations

from pathlib import PurePosixPath


class InvalidResourceError(ValueError):
    pass


def normalize_resource(resource: str) -> str:
    if not resource:
        raise InvalidResourceError("Resource cannot be empty.")

    resource = resource.replace("\\", "/")

    path = PurePosixPath(resource)

    if ".." in path.parts:
        raise InvalidResourceError(
            "Parent-directory traversal is not permitted."
        )

    normalized = str(path)

    if not normalized.startswith("/"):
        normalized = "/" + normalized

    return normalized


def exact_resource_match(
    capability_resource: str,
    requested_resource: str,
) -> bool:
    try:
        allowed = normalize_resource(capability_resource)
        requested = normalize_resource(requested_resource)
    except InvalidResourceError:
        return False

    return allowed == requested