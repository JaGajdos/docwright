import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { IpRateLimiter } from "./rateLimit.js";
import type { GenerateDocsOutput } from "@docwright/core";

const fakeResult: GenerateDocsOutput = {
  readmeMarkdown: "# Demo",
  architectureMermaid: "flowchart TB\n  A --> B",
  architectureMarkdownFile: "# Architecture",
  warnings: [],
  prCommentMarkdown: "<!-- docwright-bot -->\n## Docwright",
};

describe("POST /v1/generate", () => {
  it("returns 400 for missing repo", async () => {
    const { app } = createApp({
      generate: async () => fakeResult,
      rateLimiter: new IpRateLimiter({ perHour: 100, perDay: 100 }),
    });
    const res = await app.request("/v1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("INVALID_REPO");
  });

  it("returns 200 with docs shape", async () => {
    const { app } = createApp({
      generate: async () => fakeResult,
      rateLimiter: new IpRateLimiter({ perHour: 100, perDay: 100 }),
    });
    const res = await app.request("/v1/generate", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify({ repo: "owner/repo" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      readmeMarkdown: string;
      architectureMermaid: string;
      prCommentMarkdown: string;
    };
    expect(json.readmeMarkdown).toBe("# Demo");
    expect(json.architectureMermaid).toContain("flowchart");
    expect(json.prCommentMarkdown).toContain("docwright-bot");
  });

  it("returns 429 when rate limited", async () => {
    const limiter = new IpRateLimiter({ perHour: 1, perDay: 10 });
    const { app } = createApp({
      generate: async () => fakeResult,
      rateLimiter: limiter,
    });
    const headers = {
      "content-type": "application/json",
      "x-forwarded-for": "9.9.9.9",
    };
    const body = JSON.stringify({ repo: "owner/repo" });
    const first = await app.request("/v1/generate", {
      method: "POST",
      headers,
      body,
    });
    expect(first.status).toBe(200);
    const second = await app.request("/v1/generate", {
      method: "POST",
      headers,
      body,
    });
    expect(second.status).toBe(429);
    const json = (await second.json()) as { error: { code: string } };
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("returns 401 for bad bearer token", async () => {
    const { app } = createApp({
      generate: async () => fakeResult,
      apiKey: "secret",
      rateLimiter: new IpRateLimiter({ perHour: 100, perDay: 100 }),
    });
    const res = await app.request("/v1/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong",
      },
      body: JSON.stringify({ repo: "owner/repo" }),
    });
    expect(res.status).toBe(401);
  });

  it("accepts valid bearer", async () => {
    const { app } = createApp({
      generate: async () => fakeResult,
      apiKey: "secret",
      rateLimiter: new IpRateLimiter({ perHour: 100, perDay: 100 }),
    });
    const res = await app.request("/v1/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret",
        "x-forwarded-for": "8.8.8.8",
      },
      body: JSON.stringify({ repo: "owner/repo" }),
    });
    expect(res.status).toBe(200);
  });
});
