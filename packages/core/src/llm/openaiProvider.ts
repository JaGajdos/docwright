import { AzureOpenAI, OpenAI } from "openai";
import type { LlmProvider } from "./types.js";

function requireApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for the OpenAI / Azure / openai-compatible provider.",
    );
  }
  return apiKey;
}

export function resolveOpenAiModel(): string {
  return (
    process.env.AZURE_OPENAI_DEPLOYMENT?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

export function usesAzureOpenAI(): boolean {
  return Boolean(process.env.AZURE_OPENAI_ENDPOINT?.trim());
}

/**
 * Responses API vs Chat Completions.
 * Force with DOCWRIGHT_LLM_API=responses|chat; default Azure → responses.
 */
export function usesResponsesApi(): boolean {
  const forced = process.env.DOCWRIGHT_LLM_API?.trim().toLowerCase();
  if (forced === "responses") return true;
  if (forced === "chat") return false;
  return usesAzureOpenAI();
}

function createAzureClient(apiKey: string): AzureOpenAI {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  if (!endpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT is required for the azure provider.");
  }
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
    endpoint: endpoint.replace(/\/$/, ""),
    apiKey,
    apiVersion,
    deployment,
  });
}

function createPublicOrCompatibleClient(apiKey: string): OpenAI {
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL: baseURL.replace(/\/$/, "") } : {}),
  });
}

/**
 * Official OpenAI + Azure OpenAI (current production path).
 */
export function createOpenAiProvider(): LlmProvider {
  const apiKey = requireApiKey();
  if (usesAzureOpenAI()) {
    return {
      id: "azure",
      model: resolveOpenAiModel(),
      agentApi: usesResponsesApi() ? "responses" : "chat",
      client: createAzureClient(apiKey),
    };
  }
  return {
    id: "openai",
    model: resolveOpenAiModel(),
    agentApi: usesResponsesApi() ? "responses" : "chat",
    client: createPublicOrCompatibleClient(apiKey),
  };
}

/**
 * Any OpenAI Chat Completions–compatible endpoint (Groq, Together, Ollama, …).
 * Set OPENAI_BASE_URL + OPENAI_API_KEY (+ OPENAI_MODEL).
 * Does not use Azure Responses API.
 */
export function createOpenAiCompatibleProvider(): LlmProvider {
  const apiKey = requireApiKey();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (!baseURL) {
    throw new Error(
      "OPENAI_BASE_URL is required for DOCWRIGHT_LLM_PROVIDER=openai-compatible.",
    );
  }
  return {
    id: "openai-compatible",
    model: resolveOpenAiModel(),
    agentApi: "chat",
    client: new OpenAI({
      apiKey,
      baseURL: baseURL.replace(/\/$/, ""),
    }),
  };
}

/** Explicit Azure provider (same as openai + AZURE_OPENAI_ENDPOINT). */
export function createAzureProvider(): LlmProvider {
  const apiKey = requireApiKey();
  return {
    id: "azure",
    model: resolveOpenAiModel(),
    agentApi: usesResponsesApi() ? "responses" : "chat",
    client: createAzureClient(apiKey),
  };
}
