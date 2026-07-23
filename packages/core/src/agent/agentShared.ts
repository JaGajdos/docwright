import type { LimitedMcpSession } from "../mcp/types.js";
import type { DocwrightLimits, GenerateDocsOutput, RepoRef } from "../types.js";
import { buildPrCommentMarkdown } from "../prComment.js";
import { summarizeReadme } from "../summarizeReadme.js";
import {
  mermaidTextFallback,
  mermaidToArchitectureFile,
  sanitizeMermaidLabels,
  validateMermaidFlowchart,
} from "./mermaid.js";
import { type LlmClient } from "./llmClient.js";

export type AgentGenerateInput = RepoRef & {
  language?: string;
  template: string;
  limits: DocwrightLimits;
  sha?: string;
};

export class AgentLimitError extends Error {
  readonly code = "AGENT_LIMIT";
  constructor(message: string) {
    super(message);
    this.name = "AgentLimitError";
  }
}

export type AgentJson = {
  readmeMarkdown?: string;
  architectureMermaid?: string;
  architectureMarkdownFile?: string;
  warnings?: string[];
};

export function extractJsonObject(text: string): AgentJson | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tryParse = (raw: string): AgentJson | null => {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as AgentJson;
    } catch {
      return null;
    }
  };

  // 1) Prefer whole text — README often contains ```mermaid fences inside JSON strings.
  //    A naive /```/ regex would steal the mermaid block and break parsing.
  const direct = tryParse(trimmed);
  if (direct?.readmeMarkdown) return direct;

  // 2) Only strip an explicit ```json wrapper (not bare ``` / mermaid).
  const jsonFence = trimmed.match(/^```json\s*([\s\S]*?)```\s*$/i);
  if (jsonFence?.[1]) {
    const fromFence = tryParse(jsonFence[1].trim());
    if (fromFence?.readmeMarkdown) return fromFence;
  }

  // 3) Last resort: first {...} span in the text
  return tryParse(trimmed);
}

export function shouldForceFinal(input: {
  round: number;
  maxRounds: number;
  calledTree: boolean;
  filesRead: number;
  maxFiles: number;
  largeTree?: boolean;
}): boolean {
  const { round, maxRounds, calledTree, filesRead, maxFiles, largeTree } =
    input;
  const remaining = maxRounds - round;
  // Reserve last rounds for JSON-only answer
  if (remaining <= 2) return true;
  if (!calledTree) return false;
  // Large repos: finish ASAP after tree (+ maybe 1–2 files)
  if (largeTree && filesRead >= 2) return true;
  if (largeTree && round >= 3) return true;
  // Small repos: a few key files is enough
  if (filesRead >= Math.min(3, maxFiles)) return true;
  if (round >= 5) return true;
  return false;
}

async function repairMermaid(
  _openai: LlmClient,
  broken: string,
): Promise<string | null> {
  // No extra LLM call (saves Azure rate limit). Try label sanitization only.
  const cleaned = sanitizeMermaidLabels(
    broken.replace(/^```(?:mermaid)?\s*|\s*```$/g, "").trim(),
  );
  return validateMermaidFlowchart(cleaned).ok ? cleaned : null;
}

export async function buildAgentOutput(
  openai: LlmClient,
  parsed: AgentJson,
  input: AgentGenerateInput,
  calledTree: boolean,
  warnings: string[],
  session: LimitedMcpSession,
): Promise<GenerateDocsOutput> {
  if (!calledTree) {
    warnings.push("Agent finished without get_repository_tree (unexpected).");
  }

  let mermaid = sanitizeMermaidLabels(
    (parsed.architectureMermaid ?? "").trim(),
  );
  let fallback: string | undefined;
  const check = validateMermaidFlowchart(mermaid);
  if (!check.ok) {
    const repaired = await repairMermaid(
      openai,
      mermaid || "flowchart TB\n  A[App]",
    );
    if (repaired) {
      mermaid = repaired;
      warnings.push(`Mermaid repaired after: ${check.reason}`);
    } else {
      fallback = mermaidTextFallback(mermaid);
      warnings.push(`Mermaid fallback after: ${check.reason}`);
      mermaid = "";
    }
  }

  const architectureMarkdownFile =
    parsed.architectureMarkdownFile?.trim() ||
    (mermaid
      ? mermaidToArchitectureFile(mermaid)
      : `# Architecture\n\n${fallback ?? "_Not detected from repo._"}\n`);

  let readme = parsed.readmeMarkdown ?? "";
  if (readme.includes("{{architecture_map}}")) {
    const block = mermaid
      ? `\`\`\`mermaid\n${mermaid}\n\`\`\``
      : (fallback ?? "_Not detected from repo._");
    readme = readme.replace("{{architecture_map}}", block);
  }

  const allWarnings = [
    ...warnings,
    ...(parsed.warnings ?? []),
    ...session.getWarnings(),
  ];

  const readmeSummary = summarizeReadme(readme);
  const prCommentMarkdown = buildPrCommentMarkdown({
    architectureMermaid: mermaid || undefined,
    architectureFallbackText: fallback,
    readmeSummary,
    sha: input.sha,
  });

  return {
    readmeMarkdown: readme,
    architectureMermaid: mermaid,
    architectureMarkdownFile,
    architectureFallbackText: fallback,
    warnings: [...new Set(allWarnings)],
    prCommentMarkdown,
  };
}
