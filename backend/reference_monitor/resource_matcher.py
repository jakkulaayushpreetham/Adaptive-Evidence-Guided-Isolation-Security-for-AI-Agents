from backend.capability.capability_scope import exact_resource_match


class ResourceMatcher:

    @staticmethod
    def matches(
        allowed_resource: str,
        requested_resource: str,
    ) -> bool:

        return exact_resource_match(
            allowed_resource,
            requested_resource,
        )