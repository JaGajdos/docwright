import { describe, expect, it } from "vitest";
import {
  mermaidTextFallback,
  sanitizeMermaidLabels,
  validateMermaidFlowchart,
} from "./mermaid.js";

describe("validateMermaidFlowchart", () => {
  it("accepts simple flowchart", () => {
    const r = validateMermaidFlowchart("flowchart TB\n  A --> B");
    expect(r.ok).toBe(true);
  });

  it("rejects fences", () => {
    const r = validateMermaidFlowchart(
      "```mermaid\nflowchart TB\n A --> B\n```",
    );
    expect(r.ok).toBe(false);
  });

  it("rejects empty", () => {
    expect(validateMermaidFlowchart("").ok).toBe(false);
  });
});

describe("sanitizeMermaidLabels", () => {
  it("quotes labels with @ and /", () => {
    const src =
      "flowchart LR\n  Package[@sindresorhus/is package] --> Entry[source/index.ts]";
    const out = sanitizeMermaidLabels(src);
    expect(out).toContain('Package["@sindresorhus/is package"]');
    expect(out).toContain('Entry["source/index.ts"]');
  });
});

describe("mermaidTextFallback", () => {
  it("wraps attempt", () => {
    expect(mermaidTextFallback("x")).toContain("textual map");
  });
});
