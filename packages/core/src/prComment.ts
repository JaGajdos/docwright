export const DOCWRIGHT_BOT_MARKER = "<!-- docwright-bot -->";

export type PrCommentInput = {
  architectureMermaid?: string;
  architectureFallbackText?: string;
  readmeSummary: string;
  sha?: string;
};

function architectureBlock(input: PrCommentInput): string {
  const mermaid = input.architectureMermaid?.trim();
  if (mermaid) {
    return ["### Architecture", "", "```mermaid", mermaid, "```"].join("\n");
  }
  const fallback = input.architectureFallbackText?.trim();
  if (fallback) {
    return ["### Architecture", "", fallback].join("\n");
  }
  return ["### Architecture", "", "_Not detected from repo._"].join("\n");
}

/**
 * Sticky PR comment body (doc/06, doc/11).
 */
export function buildPrCommentMarkdown(input: PrCommentInput): string {
  const shaShort = input.sha ? input.sha.slice(0, 7) : "unknown";
  return [
    DOCWRIGHT_BOT_MARKER,
    "## Docwright — onboarding docs",
    "",
    `_Generated for this PR (\`${shaShort}\`)._`,
    "",
    architectureBlock(input),
    "",
    "### README (summary)",
    "",
    input.readmeSummary.trim() || "_No README summary available._",
    "",
    "---",
    "_AI-generated draft — review before use. Docwright · jump to exploration_",
    "",
  ].join("\n");
}

export function isDocwrightBotComment(body: string): boolean {
  return body.includes(DOCWRIGHT_BOT_MARKER);
}
