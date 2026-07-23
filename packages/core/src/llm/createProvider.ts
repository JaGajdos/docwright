import {
  createAzureProvider,
  createOpenAiCompatibleProvider,
  createOpenAiProvider,
} from "./openaiProvider.js";
import type { CreateLlmProviderOptions, LlmProvider } from "./types.js";

/**
 * Resolve LLM backend from DOCWRIGHT_LLM_PROVIDER (default: openai).
 *
 * | Id                 | Notes                                              |
 * |--------------------|----------------------------------------------------|
 * | openai (default)   | Public OpenAI or Azure if AZURE_OPENAI_ENDPOINT set |
 * | azure              | Force Azure OpenAI client                          |
 * | openai-compatible  | OPENAI_BASE_URL (Groq, Ollama, vLLM, …)            |
 *
 * To add Anthropic / Gemini / etc.: implement `LlmProvider` (or a native agent
 * loop) and register it in the switch below.
 */
export function createLlmProvider(
  options: CreateLlmProviderOptions = {},
): LlmProvider {
  const raw =
    options.providerId?.trim() ||
    process.env.DOCWRIGHT_LLM_PROVIDER?.trim() ||
    "openai";
  const id = raw.toLowerCase();

  switch (id) {
    case "openai":
      return createOpenAiProvider();
    case "azure":
      return createAzureProvider();
    case "openai-compatible":
      return createOpenAiCompatibleProvider();
    default:
      throw new Error(
        `Unknown DOCWRIGHT_LLM_PROVIDER="${raw}". Supported: openai, azure, openai-compatible. Add new providers in packages/core/src/llm/createProvider.ts.`,
      );
  }
}
