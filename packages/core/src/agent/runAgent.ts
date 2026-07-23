import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "openai/resources/chat/completions";
import type { LimitedMcpSession } from "../mcp/types.js";
import type { DocwrightLimits, GenerateDocsOutput, RepoRef } from "../types.js";
import { buildPrCommentMarkdown } from "../prComment.js";
import { summarizeReadme } from "../summarizeReadme.js";
import {
  mermaidTextFallback,
  mermaidToArchitectureFile,
  validateMermaidFlowchart,
} from "./mermaid.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import { createLlmClient, resolveLlmModel, type LlmClient } from "./llmClient.js";

const ALLOWED_TOOLS = new Set(["get_repository_tree", "get_file_contents"]);

const openAiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_repository_tree",
      description: "Get file/directory tree of a public GitHub repo",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          tree_sha: {
            type: "string",
            description: "Optional ref (branch/tag/sha)",
          },
          recursive: { type: "boolean", default: true },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_file_contents",
      description: "Get contents of a file in the repo",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          path: { type: "string" },
          ref: { type: "string" },
        },
        required: ["owner", "repo", "path"],
      },
    },
  },
];

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

type AgentJson = {
  readmeMarkdown?: string;
  architectureMermaid?: string;
  architectureMarkdownFile?: string;
  warnings?: string[];
};

function extractJsonObject(text: string): AgentJson | null {
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

function getOpenAI(): LlmClient {
  return createLlmClient();
}

function modelName(): string {
  return resolveLlmModel();
}

/** Some Azure deployments reject custom temperature — omit unless set. */
function chatTemperature(fallback: number): number | undefined {
  const raw = process.env.OPENAI_TEMPERATURE?.trim();
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  if (
    process.env.AZURE_OPENAI_ENDPOINT?.trim() ||
    process.env.OPENAI_BASE_URL?.trim()
  ) {
    return undefined;
  }
  return fallback;
}

const FINAL_JSON_INSTRUCTION =
  "STOP calling tools. Based only on tool results already in this conversation, respond with ONLY one JSON object (no markdown fences) with keys: readmeMarkdown, architectureMermaid, architectureMarkdownFile, warnings. Fill the README template as best you can; use \"_Not detected from repo._\" where unknown.";

async function repairMermaid(
  openai: LlmClient,
  broken: string,
): Promise<string | null> {
  const completion = await openai.chat.completions.create({
    model: modelName(),
    ...(chatTemperature(0) !== undefined
      ? { temperature: chatTemperature(0) }
      : {}),
    messages: [
      {
        role: "system",
        content:
          "Fix the Mermaid flowchart. Return ONLY raw mermaid starting with flowchart TB or LR. No fences. Max 12 nodes.",
      },
      { role: "user", content: broken },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) return null;
  const cleaned = text.replace(/^```(?:mermaid)?\s*|\s*```$/g, "").trim();
  return validateMermaidFlowchart(cleaned).ok ? cleaned : null;
}

async function buildOutput(
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

/**
 * After enough exploration (or near round budget), stop tools and demand JSON.
 */
function shouldForceFinal(input: {
  round: number;
  maxRounds: number;
  calledTree: boolean;
  filesRead: number;
  maxFiles: number;
}): boolean {
  const { round, maxRounds, calledTree, filesRead, maxFiles } = input;
  const remaining = maxRounds - round;
  // Always reserve last rounds for a text/JSON answer
  if (remaining <= 3) return true;
  if (!calledTree) return false;
  if (filesRead >= Math.min(6, maxFiles)) return true;
  if (round >= 8) return true;
  return false;
}

export async function runDocwrightAgent(
  session: LimitedMcpSession,
  input: AgentGenerateInput,
): Promise<GenerateDocsOutput> {
  const openai = getOpenAI();
  const language = input.language ?? "en";
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(language) },
    {
      role: "user",
      content: buildUserPrompt({
        owner: input.owner,
        repo: input.repo,
        ref: input.ref,
        template: input.template,
      }),
    },
  ];

  let calledTree = false;
  const warnings = [...session.getWarnings()];
  let forcedFinalOnce = false;

  for (let round = 0; round < input.limits.maxToolRounds; round++) {
    const forceFinal = shouldForceFinal({
      round,
      maxRounds: input.limits.maxToolRounds,
      calledTree,
      filesRead: session.getFilesReadCount(),
      maxFiles: input.limits.maxFilesRead,
    });

    if (forceFinal && !forcedFinalOnce) {
      messages.push({ role: "user", content: FINAL_JSON_INSTRUCTION });
      forcedFinalOnce = true;
      warnings.push("Forced final JSON (tool budget / enough context).");
    }

    let toolChoice: ChatCompletionToolChoiceOption = "auto";
    if (!forceFinal) {
      if (round === 0) {
        toolChoice = {
          type: "function",
          function: { name: "get_repository_tree" },
        };
      } else {
        toolChoice = "auto";
      }
    }

    const completion = await openai.chat.completions.create({
      model: modelName(),
      ...(chatTemperature(0.2) !== undefined
        ? { temperature: chatTemperature(0.2) }
        : {}),
      messages,
      ...(forceFinal
        ? {
            // No tools — model must answer with JSON text
            response_format: { type: "json_object" as const },
          }
        : {
            tools: openAiTools,
            tool_choice: toolChoice,
          }),
    });

    const msg = completion.choices[0]?.message;
    if (!msg) {
      throw new Error("Empty completion from OpenAI.");
    }

    const toolCalls =
      forceFinal || !msg.tool_calls?.length ? undefined : msg.tool_calls;

    messages.push({
      role: "assistant",
      content: msg.content,
      ...(toolCalls ? { tool_calls: toolCalls } : {}),
    });

    if (toolCalls && toolCalls.length > 0) {
      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const name = call.function.name;
        if (!ALLOWED_TOOLS.has(name)) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              error: "TOOL_NOT_ALLOWED",
              message: `Tool ${name} is not allowed.`,
            }),
          });
          continue;
        }

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}") as Record<
            string,
            unknown
          >;
        } catch {
          args = {};
        }

        args.owner = input.owner;
        args.repo = input.repo;
        if (name === "get_repository_tree") {
          calledTree = true;
          if (input.ref && args.tree_sha === undefined) {
            args.tree_sha = input.ref;
          }
          if (args.recursive === undefined) {
            args.recursive = input.limits.treeRecursive;
          }
        }
        if (name === "get_file_contents" && input.ref && args.ref === undefined) {
          args.ref = input.ref;
        }

        const result = await session.callTool(
          name as "get_repository_tree" | "get_file_contents",
          args,
        );
        let text = result.text;
        if (
          name === "get_file_contents" &&
          text.length > input.limits.maxFileBytes
        ) {
          text =
            text.slice(0, input.limits.maxFileBytes) +
            "\n\n[truncated: file exceeded maxFileBytes]";
          warnings.push(`Truncated ${String(args.path)}`);
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: text,
        });
      }
      warnings.push(...session.getWarnings());
      continue;
    }

    const parsed = extractJsonObject(msg.content ?? "");
    if (!parsed?.readmeMarkdown) {
      if (!forcedFinalOnce) {
        messages.push({ role: "user", content: FINAL_JSON_INSTRUCTION });
        forcedFinalOnce = true;
      } else {
        messages.push({
          role: "user",
          content:
            "Your last reply was not valid JSON with readmeMarkdown. Return ONLY the JSON object now.",
        });
      }
      continue;
    }

    return buildOutput(
      openai,
      parsed,
      input,
      calledTree,
      warnings,
      session,
    );
  }

  throw new AgentLimitError(
    `Agent exceeded max_tool_rounds (${input.limits.maxToolRounds}) without final README.`,
  );
}
