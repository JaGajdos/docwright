import { AzureOpenAI, OpenAI } from "openai";

export type LlmClient = OpenAI | AzureOpenAI;

export function usesAzureOpenAI(): boolean {
  return Boolean(
    process.env.AZURE_OPENAI_ENDPOINT?.trim() ||
      process.env.OPENAI_BASE_URL?.trim(),
  );
}

export function usesResponsesApi(): boolean {
  const forced = process.env.DOCWRIGHT_LLM_API?.trim().toLowerCase();
  if (forced === "responses") return true;
  if (forced === "chat") return false;
  // Azure gpt-5.6-* (Aston) uses /openai/responses
  return usesAzureOpenAI();
}

/**
 * OpenAI or Azure OpenAI from env.
 *
 * Azure (Aston hackathon) — Responses API:
 *   AZURE_OPENAI_ENDPOINT=https://aston-hct.openai.azure.com
 *   AZURE_OPENAI_API_VERSION=2025-04-01-preview
 *   AZURE_OPENAI_DEPLOYMENT=T1-gpt-5.6-terra
 *   OPENAI_API_KEY=<azure key>
 *
 * Public OpenAI (Chat Completions):
 *   OPENAI_API_KEY=sk-...
 *   OPENAI_MODEL=gpt-4o-mini
 */
export function createLlmClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  const azureEndpoint =
    process.env.AZURE_OPENAI_ENDPOINT?.trim() ||
    process.env.OPENAI_BASE_URL?.trim();

  if (azureEndpoint) {
    const apiVersion =
      process.env.AZURE_OPENAI_API_VERSION?.trim() || "2025-04-01-preview";
    const deployment =
      process.env.AZURE_OPENAI_DEPLOYMENT?.trim() ||
      process.env.OPENAI_MODEL?.trim();
    if (!deployment) {
      throw new Error(
        "AZURE_OPENAI_DEPLOYMENT (or OPENAI_MODEL) is required for Azure OpenAI.",
      );
    }
    return new AzureOpenAI({
      endpoint: azureEndpoint.replace(/\/$/, ""),
      apiKey,
      apiVersion,
      deployment,
    });
  }

  return new OpenAI({ apiKey });
}

/** Model / deployment name passed to API calls */
export function resolveLlmModel(): string {
  return (
    process.env.AZURE_OPENAI_DEPLOYMENT?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}
