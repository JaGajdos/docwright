export type {
  CreateLlmProviderOptions,
  LlmProvider,
  LlmProviderId,
} from "./types.js";
export { createLlmProvider } from "./createProvider.js";
export {
  createAzureProvider,
  createOpenAiCompatibleProvider,
  createOpenAiProvider,
  resolveOpenAiModel,
  usesAzureOpenAI,
  usesResponsesApi,
} from "./openaiProvider.js";

/** @deprecated Prefer `LlmProvider["client"]` via createLlmProvider(). */
export type { OpenAI, AzureOpenAI } from "openai";
