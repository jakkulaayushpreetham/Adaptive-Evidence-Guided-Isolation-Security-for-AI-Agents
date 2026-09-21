"""GPU-local/cloud task planning with structured, least-privilege output."""
from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter
from typing import Callable, Literal

from fastapi import HTTPException
import httpx
from google import genai
from google.genai import errors as genai_errors
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)
from pydantic import BaseModel, ConfigDict, Field

from backend.capability.capability import Operation
from backend.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_TIMEOUT_SECONDS,
    OLLAMA_BASE_URL,
    OLLAMA_ENABLED,
    OLLAMA_MODEL,
    OLLAMA_TIMEOUT_SECONDS,
)
from backend.task_engine.policy_validator import CapabilityProposal, PolicyValidator


ActionOperation = Literal["READ_FILE", "WRITE_FILE", "NETWORK", "EXECUTE", "DELETE_FILE"]
GrantableOperation = Literal["READ_FILE", "WRITE_FILE", "NETWORK"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]


class GeneratedAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    operation: ActionOperation
    resource: str = Field(min_length=1, max_length=500)
    rationale: str = Field(min_length=3, max_length=300)


class GeneratedCapability(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation: GrantableOperation
    resource: str = Field(min_length=1, max_length=500)
    rationale: str = Field(min_length=3, max_length=300)
    risk: RiskLevel


class GeneratedTaskPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=120)
    summary: str = Field(min_length=3, max_length=500)
    actions: list[GeneratedAction] = Field(min_length=1, max_length=8)
    capabilities: list[GeneratedCapability] = Field(max_length=8)
    security_notes: list[str] = Field(max_length=4)


SYSTEM_INSTRUCTIONS = """
You are the planning component of AEGIS-AI, a task-scoped adaptive security runtime.
Convert the operator's task into an ordered execution plan and the smallest possible
capability envelope. You only propose; you never execute actions or grant permissions.

Rules:
- Return between 1 and 8 concise, concrete actions.
- Use only READ_FILE, WRITE_FILE, NETWORK, EXECUTE, or DELETE_FILE for actions.
- Capabilities may use only READ_FILE, WRITE_FILE, or NETWORK.
- Every capability must be necessary for at least one action and must be deduplicated.
- Prefer exact resources over directories or wildcards.
- Reads must target exact paths below /workspace/input/.
- Writes must target exact paths below /workspace/output/.
- Never propose access to credentials, secrets, .env files, host files, or unrelated data.
- EXECUTE and DELETE_FILE are denied by default. They may appear as required actions, but
  never as proposed capabilities; explain the restriction in security_notes instead.
- Do not invent permissions merely because they might be convenient.
- Rationales should explain necessity without exposing hidden chain-of-thought.
- The human operator makes the final authorization decision.
""".strip()


class TaskAnalyzerService:
    """Turn a natural-language task into a validated multi-provider proposal."""

    def __init__(
        self,
        client_factory: Callable[..., OpenAI] | None = None,
        gemini_client_factory: Callable[..., object] | None = None,
        ollama_client_factory: Callable[..., object] | None = None,
    ) -> None:
        self._client_factory = client_factory or OpenAI
        self._gemini_client_factory = gemini_client_factory or genai.Client
        self._ollama_client_factory = ollama_client_factory or httpx.Client

    @staticmethod
    def _provider_message(exc: Exception) -> str | None:
        message = None
        body = getattr(exc, "body", None)
        if isinstance(body, dict):
            message = body.get("message")
            nested_error = body.get("error")
            if not message and isinstance(nested_error, dict):
                message = nested_error.get("message")
            if not message and nested_error:
                message = nested_error
        if not message:
            message = getattr(exc, "message", None)
        return str(message)[:300] if message else None

    @staticmethod
    def _usage_payload(response: object) -> dict:
        usage = getattr(response, "usage", None)
        return {
            "input_tokens": int(getattr(usage, "input_tokens", 0) or 0),
            "output_tokens": int(getattr(usage, "output_tokens", 0) or 0),
            "total_tokens": int(getattr(usage, "total_tokens", 0) or 0),
        }

    @staticmethod
    def _gemini_usage_payload(response: object) -> dict:
        usage = getattr(response, "usage", None)
        return {
            "input_tokens": int(getattr(usage, "total_input_tokens", 0) or 0),
            "output_tokens": int(getattr(usage, "total_output_tokens", 0) or 0),
            "total_tokens": int(getattr(usage, "total_tokens", 0) or 0),
        }

    @staticmethod
    def _validate_capabilities(plan: GeneratedTaskPlan) -> tuple[list[dict], list[str]]:
        """Apply deterministic policy checks after model generation."""
        validator = PolicyValidator()
        validated: list[dict] = []
        notes = list(plan.security_notes)
        seen: set[tuple[str, str]] = set()

        for capability in plan.capabilities:
            try:
                proposal = validator.validate(
                    CapabilityProposal(
                        operation=Operation(capability.operation),
                        resource=capability.resource,
                    )
                )
            except ValueError as exc:
                note = f"Policy removed {capability.operation} for {capability.resource}: {exc}"
                if note not in notes:
                    notes.append(note)
                continue

            identity = (proposal.operation.value, proposal.resource)
            if identity in seen:
                continue
            seen.add(identity)
            validated.append(
                {
                    "operation": proposal.operation.value,
                    "resource": proposal.resource,
                    "rationale": capability.rationale,
                    "risk": capability.risk,
                }
            )

        return validated[:8], notes[:6]

    def _finalize(
        self,
        *,
        parsed: GeneratedTaskPlan,
        provider: Literal["openai", "gemini", "ollama"],
        model: str,
        analysis_id: str | None,
        usage: dict,
        started: float,
        fallback_from: str | None = None,
    ) -> dict:
        capabilities, security_notes = self._validate_capabilities(parsed)
        result = parsed.model_dump()
        result["capabilities"] = capabilities
        result["security_notes"] = security_notes
        result.update(
            {
                "provider": provider,
                "model": model,
                "analysis_id": analysis_id,
                "generated_at": datetime.now(timezone.utc),
                "latency_ms": round((perf_counter() - started) * 1000),
                "usage": usage,
                "fallback_from": fallback_from,
            }
        )
        return result

    def _analyze_with_ollama(self, task_description: str) -> dict:
        """Run schema-constrained inference in Ollama (CUDA on supported NVIDIA GPUs)."""
        started = perf_counter()
        payload = {
            "model": OLLAMA_MODEL,
            "stream": False,
            # Qwen3 otherwise spends the token budget on a hidden reasoning trace.
            # Structured planning is faster and more reliable in non-thinking mode.
            "think": False,
            "keep_alive": "10m",
            "messages": [
                {"role": "system", "content": SYSTEM_INSTRUCTIONS},
                {"role": "user", "content": task_description},
            ],
            "format": GeneratedTaskPlan.model_json_schema(),
            "options": {
                "temperature": 0,
                "num_ctx": 4096,
                "num_predict": 1200,
            },
        }
        try:
            with self._ollama_client_factory(timeout=OLLAMA_TIMEOUT_SECONDS) as client:
                response = client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                response.raise_for_status()
                body = response.json()
        except httpx.ConnectError as exc:
            raise HTTPException(
                status_code=503,
                detail="Local GPU analyzer is not running. Start Ollama and try again.",
            ) from exc
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="Local GPU analysis timed out.") from exc
        except httpx.HTTPStatusError as exc:
            detail = "Ollama could not analyze this task."
            try:
                detail = exc.response.json().get("error", detail)
            except (ValueError, AttributeError):
                pass
            raise HTTPException(status_code=502, detail=detail) from exc

        content = body.get("message", {}).get("content")
        if not content:
            raise HTTPException(status_code=502, detail="Ollama returned no structured task plan.")
        try:
            parsed = GeneratedTaskPlan.model_validate_json(content)
        except ValueError as exc:
            raise HTTPException(status_code=502, detail="Ollama returned an invalid task plan.") from exc

        input_tokens = int(body.get("prompt_eval_count", 0) or 0)
        output_tokens = int(body.get("eval_count", 0) or 0)
        return self._finalize(
            parsed=parsed,
            provider="ollama",
            model=body.get("model") or OLLAMA_MODEL,
            analysis_id=None,
            usage={
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            },
            started=started,
        )

    def _analyze_with_gemini(
        self,
        task_description: str,
        *,
        fallback_from: str | None = None,
    ) -> dict:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

        started = perf_counter()
        client = self._gemini_client_factory(api_key=GEMINI_API_KEY)
        try:
            response = client.interactions.create(
                model=GEMINI_MODEL,
                system_instruction=SYSTEM_INSTRUCTIONS,
                input=task_description,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": GeneratedTaskPlan.model_json_schema(),
                },
                timeout=OPENAI_TIMEOUT_SECONDS,
            )
        except genai_errors.ClientError as exc:
            code = int(getattr(exc, "code", 400) or 400)
            if code in (401, 403):
                raise HTTPException(status_code=401, detail="Gemini rejected GEMINI_API_KEY.") from exc
            if code == 429:
                raise HTTPException(status_code=429, detail="Gemini free-tier quota was reached.") from exc
            raise HTTPException(status_code=502, detail=f"Gemini request failed ({code}).") from exc
        except genai_errors.APIError as exc:
            raise HTTPException(status_code=503, detail="Could not reach Gemini.") from exc
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

        output_text = getattr(response, "output_text", None)
        if not output_text:
            raise HTTPException(status_code=502, detail="Gemini returned no structured task plan.")
        parsed = GeneratedTaskPlan.model_validate_json(output_text)
        return self._finalize(
            parsed=parsed,
            provider="gemini",
            model=getattr(response, "model", None) or GEMINI_MODEL,
            analysis_id=getattr(response, "id", None),
            usage=self._gemini_usage_payload(response),
            started=started,
            fallback_from=fallback_from,
        )

    def analyze(
        self,
        *,
        task_description: str,
        api_key: str | None = None,
        model: str | None = None,
    ) -> dict:
        # Explicit OpenAI arguments are primarily used by tests/advanced callers and
        # should continue to select OpenAI even when local inference is enabled.
        if OLLAMA_ENABLED and api_key is None and model is None:
            try:
                return self._analyze_with_ollama(task_description)
            except HTTPException:
                # Preserve availability while Ollama starts or a model is being pulled.
                # Cloud handling below still enforces the same deterministic policy.
                pass

        effective_key = api_key or OPENAI_API_KEY
        effective_model = model or OPENAI_MODEL
        if not effective_key and GEMINI_API_KEY:
            return self._analyze_with_gemini(task_description)
        if not effective_key:
            raise HTTPException(
                status_code=503,
                detail="Neither OPENAI_API_KEY nor GEMINI_API_KEY is configured.",
            )

        client = self._client_factory(
            api_key=effective_key,
            timeout=OPENAI_TIMEOUT_SECONDS,
            max_retries=1,
        )
        started = perf_counter()
        try:
            response = client.responses.parse(
                model=effective_model,
                instructions=SYSTEM_INSTRUCTIONS,
                input=task_description,
                text_format=GeneratedTaskPlan,
                max_output_tokens=1800,
                store=False,
            )
        except AuthenticationError as exc:
            raise HTTPException(
                status_code=401,
                detail="OpenAI rejected the API key. Check OPENAI_API_KEY and try again.",
            ) from exc
        except RateLimitError as exc:
            if GEMINI_API_KEY:
                return self._analyze_with_gemini(task_description, fallback_from="openai")
            detail = self._provider_message(exc) or "OpenAI rate limit or account quota reached."
            raise HTTPException(status_code=429, detail=detail) from exc
        except (APITimeoutError, APIConnectionError) as exc:
            raise HTTPException(
                status_code=503,
                detail="Could not reach OpenAI. Check the network connection and try again.",
            ) from exc
        except APIStatusError as exc:
            detail = self._provider_message(exc) or "OpenAI could not analyze this task."
            raise HTTPException(status_code=502, detail=detail) from exc

        parsed = getattr(response, "output_parsed", None)
        if parsed is None:
            raise HTTPException(
                status_code=502,
                detail="OpenAI returned no structured task plan.",
            )
        if not isinstance(parsed, GeneratedTaskPlan):
            parsed = GeneratedTaskPlan.model_validate(parsed)

        return self._finalize(
            parsed=parsed,
            provider="openai",
            model=getattr(response, "model", None) or effective_model,
            analysis_id=getattr(response, "id", None),
            usage=self._usage_payload(response),
            started=started,
        )
