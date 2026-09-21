# AEGIS-AI

Task-Scoped Adaptive OS Capability Enforcement with Dempster-Shafer Trust Modeling and Dynamic Privilege Revocation for Autonomous AI Agents.

## Local RTX task intelligence

The **Assign Task** workspace uses OpenAI Structured Outputs to convert a natural-language task into:

- an ordered, reviewable action plan;
- a deduplicated least-privilege capability proposal;
- concise security notes; and
- model, latency, and token-usage metadata.

The model never grants permissions. Every generated capability is checked by the deterministic AEGIS policy validator, shown to the operator, and granted only after explicit human approval.

Create a local `.env` from `.env.example` and set:

```dotenv
OLLAMA_ENABLED=true
OLLAMA_MODEL=qwen3:4b
OPENAI_API_KEY=your_new_project_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_SECONDS=45
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.8-flash
```

Keep `.env` local; it is ignored by Git. Install the backend dependencies with `pip install -r requirements.txt`, then launch the backend and frontend normally. With `OLLAMA_ENABLED=true`, the planner first uses the local Ollama model (and therefore a supported NVIDIA GPU), then falls back to OpenAI/Gemini if the local runtime is unavailable. LangChain is not required.
