/**
 * Backward-compatible facade over the pluggable LLM layer (`../llm`).
 *
 * Prefer `createLlmProvider()` for new code.
 */
import { createLlmProvider } from "../llm/createProvider.js";
import type { LlmProvider } from "../llm/types.js";
import {
  resolveOpenAiModel,
  usesAzureOpenAI,
  usesResponsesApi,
} from "../llm/openaiProvider.js";

export type { OpenAI, AzureOpenAI } from "openai";
export type LlmClient = LlmProvider["client"];

export { usesAzureOpenAI, usesResponsesApi, resolveOpenAiModel };

/** @deprecated Use resolveOpenAiModel / provider.model */
export function resolveLlmModel(): string {
  return resolveOpenAiModel();
}

/** Create the configured provider's OpenAI-compatible SDK client. */
export function createLlmClient(): LlmClient {
  return createLlmProvider().client;
}

export function createConfiguredLlmProvider(): LlmProvider {
  return createLlmProvider();
}
