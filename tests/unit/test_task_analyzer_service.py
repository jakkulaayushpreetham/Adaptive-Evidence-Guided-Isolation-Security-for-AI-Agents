from types import SimpleNamespace

from backend.services.task_analyzer_service import (
    GeneratedAction,
    GeneratedCapability,
    GeneratedTaskPlan,
    TaskAnalyzerService,
)


class FakeResponses:
    def __init__(self, response):
        self.response = response
        self.request = None

    def parse(self, **kwargs):
        self.request = kwargs
        return self.response


class FakeClient:
    def __init__(self, response):
        self.responses = FakeResponses(response)


def build_plan(*capabilities: GeneratedCapability) -> GeneratedTaskPlan:
    return GeneratedTaskPlan(
        title="Summarize research",
        summary="Read the authorized input and write a concise summary.",
        actions=[
            GeneratedAction(
                name="Read research",
                operation="READ_FILE",
                resource="/workspace/input/research.txt",
                rationale="The source document is required for the summary.",
            ),
            GeneratedAction(
                name="Write summary",
                operation="WRITE_FILE",
                resource="/workspace/output/summary.txt",
                rationale="The requested result must be saved in the output workspace.",
            ),
        ],
        capabilities=list(capabilities),
        security_notes=[],
    )


def test_analyze_uses_openai_structured_outputs_and_returns_metadata():
    plan = build_plan(
        GeneratedCapability(
            operation="READ_FILE",
            resource="/workspace/input/research.txt",
            rationale="Required input.",
            risk="LOW",
        ),
        GeneratedCapability(
            operation="WRITE_FILE",
            resource="/workspace/output/summary.txt",
            rationale="Required output.",
            risk="MEDIUM",
        ),
    )
    response = SimpleNamespace(
        id="resp_test",
        model="gpt-test-structured",
        output_parsed=plan,
        usage=SimpleNamespace(input_tokens=42, output_tokens=21, total_tokens=63),
    )
    client = FakeClient(response)
    client_options = {}

    def client_factory(**kwargs):
        client_options.update(kwargs)
        return client

    result = TaskAnalyzerService(client_factory=client_factory).analyze(
        task_description="Read the research input and write a summary.",
        api_key="sk-test-not-a-real-secret",
        model="gpt-test-structured",
    )

    assert client_options["api_key"] == "sk-test-not-a-real-secret"
    assert client.responses.request["text_format"] is GeneratedTaskPlan
    assert client.responses.request["store"] is False
    assert result["provider"] == "openai"
    assert result["model"] == "gpt-test-structured"
    assert result["analysis_id"] == "resp_test"
    assert result["usage"] == {
        "input_tokens": 42,
        "output_tokens": 21,
        "total_tokens": 63,
    }
    assert [capability["operation"] for capability in result["capabilities"]] == [
        "READ_FILE",
        "WRITE_FILE",
    ]


def test_policy_removes_unsafe_and_duplicate_model_capabilities():
    plan = build_plan(
        GeneratedCapability(
            operation="READ_FILE",
            resource="/workspace/input/research.txt",
            rationale="Required input.",
            risk="LOW",
        ),
        GeneratedCapability(
            operation="READ_FILE",
            resource="/workspace/input/research.txt",
            rationale="Duplicate input.",
            risk="LOW",
        ),
        GeneratedCapability(
            operation="READ_FILE",
            resource="/workspace/private/credentials.env",
            rationale="Unsafe model suggestion.",
            risk="HIGH",
        ),
    )
    response = SimpleNamespace(
        id="resp_policy",
        model="gpt-test-structured",
        output_parsed=plan,
        usage=None,
    )

    result = TaskAnalyzerService(
        client_factory=lambda **_: FakeClient(response)
    ).analyze(
        task_description="Read research.",
        api_key="sk-test-not-a-real-secret",
    )

    assert len(result["capabilities"]) == 1
    assert result["capabilities"][0]["resource"] == "/workspace/input/research.txt"
    assert any("Policy removed READ_FILE" in note for note in result["security_notes"])


def test_provider_message_prefers_clean_error_body():
    exc = SimpleNamespace(
        message="Error code: 429 - noisy wrapper",
        body={"message": "You have no credits remaining."},
    )

    assert TaskAnalyzerService._provider_message(exc) == "You have no credits remaining."


class FakeOllamaResponse:
    def raise_for_status(self):
        return None

    def json(self):
        plan = build_plan(
            GeneratedCapability(
                operation="READ_FILE",
                resource="/workspace/input/research.txt",
                rationale="Required input.",
                risk="LOW",
            )
        )
        return {
            "model": "qwen3:4b",
            "message": {"content": plan.model_dump_json()},
            "prompt_eval_count": 30,
            "eval_count": 20,
        }


class FakeOllamaClient:
    def __init__(self, **_):
        self.request = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def post(self, url, json):
        self.request = (url, json)
        return FakeOllamaResponse()


def test_ollama_uses_json_schema_and_reports_local_usage():
    service = TaskAnalyzerService(ollama_client_factory=FakeOllamaClient)
    result = service._analyze_with_ollama("Read the research and summarize it.")

    assert result["provider"] == "ollama"
    assert result["model"] == "qwen3:4b"
    assert result["usage"] == {
        "input_tokens": 30,
        "output_tokens": 20,
        "total_tokens": 50,
    }


def test_heuristic_fallback_generates_rich_dynamic_lifecycle_and_capabilities():
    service = TaskAnalyzerService()
    result = service._heuristic_fallback(
        task_description="Analyze high-velocity swift bank transactions in /workspace/input/swift.csv and emit report to /workspace/output/aml.json",
        scenario="COMPLIANT",
        started=0.0,
    )

    assert len(result["actions"]) >= 8
    assert len(result["capabilities"]) >= 5

    action_ops = {a["operation"] for a in result["actions"]}
    assert "READ_FILE" in action_ops
    assert "DATABASE_QUERY" in action_ops
    assert "MEMORY_READ" in action_ops
    assert "MEMORY_WRITE" in action_ops
    assert "IPC_CALL" in action_ops
    assert "WRITE_FILE" in action_ops

    cap_ops = {c["operation"] for c in result["capabilities"]}
    assert "DATABASE_QUERY" in cap_ops
    assert "IPC_CALL" in cap_ops
    assert "WRITE_FILE" in cap_ops


def test_policy_validator_allows_modern_operations_and_blocks_credentials():
    from backend.capability.capability import Operation
    from backend.task_engine.policy_validator import CapabilityProposal, PolicyValidator, PolicyViolation
    import pytest

    validator = PolicyValidator()

    # Modern agent operations should validate cleanly
    prop = validator.validate(CapabilityProposal(operation=Operation.DATABASE_QUERY, resource="db://finance/transactions"))
    assert prop.operation == Operation.DATABASE_QUERY
    assert prop.resource == "db://finance/transactions"

    prop_mem = validator.validate(CapabilityProposal(operation=Operation.MEMORY_READ, resource="mem://context/scratchpad"))
    assert prop_mem.operation == Operation.MEMORY_READ

    # Sensitive host / credential resources should be blocked
    with pytest.raises(PolicyViolation, match="forbidden"):
        validator.validate(CapabilityProposal(operation=Operation.READ_FILE, resource="/workspace/.env"))

    with pytest.raises(PolicyViolation, match="forbidden"):
        validator.validate(CapabilityProposal(operation=Operation.READ_FILE, resource="/root/.ssh/id_rsa"))

