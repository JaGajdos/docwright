import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./agentShared.js";

describe("extractJsonObject", () => {
  it("parses JSON that contains mermaid fences inside readmeMarkdown", () => {
    const payload = {
      readmeMarkdown:
        "# is\n\n## Architecture\n\n```mermaid\nflowchart LR\n  A --> B\n```\n",
      architectureMermaid: "flowchart LR\n  A --> B",
      architectureMarkdownFile: "# Architecture\n",
      warnings: [],
    };
    const raw = JSON.stringify(payload);
    const parsed = extractJsonObject(raw);
    expect(parsed?.readmeMarkdown).toContain("```mermaid");
    expect(parsed?.architectureMermaid).toContain("flowchart LR");
  });

  it("parses ```json fenced wrapper", () => {
    const inner = JSON.stringify({
      readmeMarkdown: "# Demo",
      architectureMermaid: "flowchart TB\n  A --> B",
      architectureMarkdownFile: "# A",
      warnings: [],
    });
    const parsed = extractJsonObject("```json\n" + inner + "\n```");
    expect(parsed?.readmeMarkdown).toBe("# Demo");
  });
});
