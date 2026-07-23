import type { LimitedMcpSession } from "../mcp/types.js";
import type { DocwrightLimits, GenerateDocsOutput, RepoRef } from "../types.js";
import { buildPrCommentMarkdown } from "../prComment.js";
import { summarizeReadme } from "../summarizeReadme.js";
import {
  mermaidTextFallback,
  mermaidToArchitectureFile,
  validateMermaidFlowchart,
} from "./mermaid.js";
import { resolveLlmModel, type LlmClient } from "./llmClient.js";
import { usesAzureOpenAI } from "./llmClient.js";

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
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as AgentJson;
  } catch {
    return null;
  }
}

export function shouldForceFinal(input: {
  round: number;
  maxRounds: number;
  calledTree: boolean;
  filesRead: number;
  maxFiles: number;
}): boolean {
  const { round, maxRounds, calledTree, filesRead, maxFiles } = input;
  const remaining = maxRounds - round;
  if (remaining <= 3) return true;
  if (!calledTree) return false;
  if (filesRead >= Math.min(6, maxFiles)) return true;
  if (round >= 8) return true;
  return false;
}

async function repairMermaid(
  openai: LlmClient,
  broken: string,
): Promise<string | null> {
  const model = resolveLlmModel();
  const prompt =
    "Fix the Mermaid flowchart. Return ONLY raw mermaid starting with flowchart TB or LR. No fences. Max 12 nodes.";

  let text: string | undefined;
  if (usesAzureOpenAI()) {
    const response = await openai.responses.create({
      model,
      instructions: prompt,
      input: broken,
    });
    text = response.output_text?.trim();
  } else {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: broken },
      ],
    });
    text = completion.choices[0]?.message?.content?.trim();
  }

  if (!text) return null;
  const cleaned = text.replace(/^```(?:mermaid)?\s*|\s*```$/g, "").trim();
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

  let mermaid = (parsed.architectureMermaid ?? "").trim();
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
