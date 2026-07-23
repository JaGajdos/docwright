import type { AzureOpenAI, OpenAI } from "openai";

/** Built-in provider ids. Add more in `createProvider.ts`. */
export type LlmProviderId = "openai" | "openai-compatible" | "azure";

/**
 * Pluggable LLM backend for Docwright agents.
 *
 * Today the agent loops speak OpenAI Chat Completions / Responses.
 * Providers that only expose that surface (OpenAI, Azure, Groq, Ollama via
 * compatible base URL) plug in here. A future Anthropic/Gemini provider can
 * either adapt to the same client shape or introduce a new agent loop.
 */
export type LlmProvider = {
  /** Selected provider id (from DOCWRIGHT_LLM_PROVIDER). */
  id: LlmProviderId | string;
  /** Model / deployment name sent to the API. */
  model: string;
  /**
   * Which agent loop to run:
   * - `chat` — portable OpenAI-compatible Chat Completions + tools
   * - `responses` — Azure/OpenAI Responses API (stateful tool turns)
   */
  agentApi: "chat" | "responses";
  /**
   * OpenAI SDK client (or Azure). Required for current agent implementations.
   * Non-OpenAI providers should wrap/adapt until a native loop exists.
   */
  client: OpenAI | AzureOpenAI;
};

export type CreateLlmProviderOptions = {
  /** Override DOCWRIGHT_LLM_PROVIDER */
  providerId?: string;
};
