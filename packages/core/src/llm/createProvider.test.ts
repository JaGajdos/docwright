import { afterEach, describe, expect, it } from "vitest";
import { createLlmProvider } from "./createProvider.js";
import { createLlmClient, resolveLlmModel } from "../agent/llmClient.js";

describe("llm providers", () => {
  const envKeys = [
    "OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT",
    "AZURE_OPENAI_API_VERSION",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "DOCWRIGHT_LLM_PROVIDER",
    "DOCWRIGHT_LLM_API",
  ] as const;
  const snapshot: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of envKeys) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  });

  function wipe(): void {
    for (const k of envKeys) {
      snapshot[k] = process.env[k];
      delete process.env[k];
    }
  }

  it("requires API key for openai", () => {
    wipe();
    expect(() => createLlmProvider()).toThrow(/OPENAI_API_KEY/);
  });

  it("defaults to openai chat provider", () => {
    wipe();
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-4o-mini";
    const p = createLlmProvider();
    expect(p.id).toBe("openai");
    expect(p.agentApi).toBe("chat");
    expect(p.model).toBe("gpt-4o-mini");
    expect(createLlmClient()).toBeTruthy();
  });

  it("uses azure + responses when endpoint set", () => {
    wipe();
    process.env.OPENAI_API_KEY = "azure-key";
    process.env.AZURE_OPENAI_ENDPOINT = "https://aston-hct.openai.azure.com/";
    process.env.AZURE_OPENAI_DEPLOYMENT = "T1-gpt-5.6-terra";
    const p = createLlmProvider();
    expect(p.id).toBe("azure");
    expect(p.agentApi).toBe("responses");
    expect(p.model).toBe("T1-gpt-5.6-terra");
    expect(resolveLlmModel()).toBe("T1-gpt-5.6-terra");
  });

  it("openai-compatible requires base URL", () => {
    wipe();
    process.env.OPENAI_API_KEY = "local-key";
    process.env.DOCWRIGHT_LLM_PROVIDER = "openai-compatible";
    expect(() => createLlmProvider()).toThrow(/OPENAI_BASE_URL/);
  });

  it("openai-compatible uses chat loop", () => {
    wipe();
    process.env.OPENAI_API_KEY = "local-key";
    process.env.OPENAI_BASE_URL = "http://127.0.0.1:11434/v1";
    process.env.OPENAI_MODEL = "llama3.2";
    process.env.DOCWRIGHT_LLM_PROVIDER = "openai-compatible";
    const p = createLlmProvider();
    expect(p.id).toBe("openai-compatible");
    expect(p.agentApi).toBe("chat");
    expect(p.model).toBe("llama3.2");
  });

  it("rejects unknown provider ids", () => {
    wipe();
    process.env.OPENAI_API_KEY = "x";
    process.env.DOCWRIGHT_LLM_PROVIDER = "anthropic";
    expect(() => createLlmProvider()).toThrow(/Unknown DOCWRIGHT_LLM_PROVIDER/);
  });
});
