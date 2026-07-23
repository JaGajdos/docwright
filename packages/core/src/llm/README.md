# LLM providers

Docwright talks to models through a small **provider** layer so GPT is not hard-wired forever.

```
generateDocs
  → createLlmProvider()          # DOCWRIGHT_LLM_PROVIDER
  → runDocwrightAgent
       ├─ agentApi=chat       → Chat Completions + tools
       └─ agentApi=responses  → OpenAI/Azure Responses API
```

## Built-in providers

| `DOCWRIGHT_LLM_PROVIDER` | When to use | Env |
|--------------------------|-------------|-----|
| `openai` (**default**) | Public OpenAI **or** Azure if `AZURE_OPENAI_ENDPOINT` is set (current hackathon setup) | `OPENAI_API_KEY`, optional `OPENAI_MODEL` / Azure vars |
| `azure` | Force Azure client | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `OPENAI_API_KEY` |
| `openai-compatible` | Groq, Together, Ollama, vLLM, … | `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` |

Force API style: `DOCWRIGHT_LLM_API=chat` or `responses` (Azure defaults to `responses`).

## Add another model family (e.g. Anthropic)

1. Implement `LlmProvider` in `packages/core/src/llm/` (or adapt to OpenAI-compatible base URL).
2. Register it in `createProvider.ts`.
3. If the vendor has no Chat Completions tools API, add a dedicated agent loop next to `runAgent.ts` / `runAgentResponses.ts` and branch on `provider.agentApi` (or a new value).

Current production path stays **GPT via `openai` / Azure** — no behaviour change when env is unchanged.
