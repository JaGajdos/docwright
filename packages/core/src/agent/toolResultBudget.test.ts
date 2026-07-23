import { describe, expect, it } from "vitest";
import { truncateToolResult } from "./toolResultBudget.js";

describe("truncateToolResult", () => {
  it("keeps small payloads", () => {
    const r = truncateToolResult("get_file_contents", "hello", 100);
    expect(r.truncated).toBe(false);
    expect(r.text).toBe("hello");
  });

  it("prioritizes README in huge trees", () => {
    const lines = [
      "node_modules/foo/index.js",
      "README.md",
      "package.json",
      ...Array.from({ length: 5000 }, (_, i) => `vendor/x/${i}.js`),
    ];
    const r = truncateToolResult("get_repository_tree", lines.join("\n"), 2000);
    expect(r.truncated).toBe(true);
    expect(r.text).toContain("README.md");
    expect(r.text).toContain("package.json");
    expect(r.text.length).toBeLessThanOrEqual(2500);
  });
});
