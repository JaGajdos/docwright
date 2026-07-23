import { describe, expect, it } from "vitest";
import { parseRepoInput } from "./parseRepo.js";

describe("parseRepoInput", () => {
  it("parses owner/repo", () => {
    const r = parseRepoInput("vercel/next.js");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ owner: "vercel", repo: "next.js" });
    }
  });

  it("parses https github URL", () => {
    const r = parseRepoInput("https://github.com/owner/repo");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.owner).toBe("owner");
      expect(r.value.repo).toBe("repo");
      expect(r.value.ref).toBeUndefined();
    }
  });

  it("parses tree ref from URL", () => {
    const r = parseRepoInput("https://github.com/owner/repo/tree/develop");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.ref).toBe("develop");
    }
  });

  it("strips .git suffix", () => {
    const r = parseRepoInput("owner/repo.git");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.repo).toBe("repo");
  });

  it("rejects empty", () => {
    const r = parseRepoInput("  ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_REPO");
  });

  it("rejects non-github host", () => {
    const r = parseRepoInput("https://gitlab.com/owner/repo");
    expect(r.ok).toBe(false);
  });
});
