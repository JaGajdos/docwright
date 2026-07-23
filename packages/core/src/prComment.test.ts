import { describe, expect, it } from "vitest";
import {
  DOCWRIGHT_BOT_MARKER,
  buildPrCommentMarkdown,
  isDocwrightBotComment,
} from "./prComment.js";
import { summarizeReadme } from "./summarizeReadme.js";

describe("buildPrCommentMarkdown", () => {
  it("includes bot marker and mermaid", () => {
    const body = buildPrCommentMarkdown({
      architectureMermaid: "flowchart TB\n  A --> B",
      readmeSummary: "# Demo\n\nHello",
      sha: "abcdef012345",
    });
    expect(body.startsWith(DOCWRIGHT_BOT_MARKER)).toBe(true);
    expect(isDocwrightBotComment(body)).toBe(true);
    expect(body).toContain("```mermaid");
    expect(body).toContain("abcdef0");
    expect(body).toContain("# Demo");
  });
});

describe("summarizeReadme", () => {
  it("keeps title, what it is, quick start and is shorter than full", () => {
    const full = `# My App

A short line.

## What it is

Does things.

## Quick start

\`\`\`
npm i
\`\`\`

## Architecture

ignore me — long architecture section that must not appear in the PR summary body
`;
    const s = summarizeReadme(full);
    expect(s).toContain("# My App");
    expect(s).toContain("What it is");
    expect(s).toContain("Quick start");
    expect(s).not.toContain("## Architecture");
    expect(s.length).toBeLessThan(full.length);
  });
});
