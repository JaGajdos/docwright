import { describe, expect, it } from "vitest";
import { createLlmClient, resolveLlmModel } from "./llmClient.js";

describe("createLlmClient", () => {
  it("requires API key", () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => createLlmClient()).toThrow(/OPENAI_API_KEY/);
    process.env.OPENAI_API_KEY = prev;
  });

  it("uses Azure when endpoint is set", () => {
    process.env.OPENAI_API_KEY = "azure-key";
    process.env.AZURE_OPENAI_ENDPOINT = "https://aston-hct.openai.azure.com/";
    process.env.AZURE_OPENAI_DEPLOYMENT = "T1-gpt-5.6-terra";
    process.env.AZURE_OPENAI_API_VERSION = "2024-04-01-preview";
    const client = createLlmClient();
    expect(client).toBeTruthy();
    expect(resolveLlmModel()).toBe("T1-gpt-5.6-terra");
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_DEPLOYMENT;
    delete process.env.AZURE_OPENAI_API_VERSION;
  });
});
