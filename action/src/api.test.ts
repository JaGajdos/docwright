import { describe, expect, it, vi } from "vitest";
import { callGenerateApi } from "./api.js";

describe("callGenerateApi", () => {
  it("posts Bearer request and returns prCommentMarkdown", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        prCommentMarkdown: "<!-- docwright-bot -->\n## Docwright",
      }),
    });

    const out = await callGenerateApi({
      apiUrl: "https://api.example.com/",
      apiKey: "secret",
      owner: "acme",
      repo: "app",
      ref: "feature",
      sha: "abc1234deadbeef",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(out.prCommentMarkdown).toContain("docwright-bot");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/v1/generate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer secret",
        }),
      }),
    );
  });

  it("throws on API error body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: { code: "REPO_INACCESSIBLE", message: "gone" },
      }),
    });

    await expect(
      callGenerateApi({
        apiUrl: "https://api.example.com",
        apiKey: "k",
        owner: "a",
        repo: "b",
        ref: "main",
        sha: "sha",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/REPO_INACCESSIBLE/);
  });
});
