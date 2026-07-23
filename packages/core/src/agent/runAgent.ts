import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "openai/resources/chat/completions";
import type { LimitedMcpSession } from "../mcp/types.js";
import type { GenerateDocsOutput } from "../types.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import {
  createLlmClient,
  resolveLlmModel,
  usesResponsesApi,
  type LlmClient,
} from "./llmClient.js";
import {
  AgentLimitError,
  buildAgentOutput,
  extractJsonObject,
  shouldForceFinal,
  type AgentGenerateInput,
} from "./agentShared.js";
import { runDocwrightAgentResponses } from "./runAgentResponses.js";
import { debugLog } from "../debug.js";
import { truncateToolResult } from "./toolResultBudget.js";

export type { AgentGenerateInput } from "./agentShared.js";
export { AgentLimitError } from "./agentShared.js";

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

const FINAL_JSON_INSTRUCTION =
  "STOP calling tools. Based only on tool results already in this conversation, respond with ONLY one JSON object (no markdown fences) with keys: readmeMarkdown, architectureMermaid, architectureMarkdownFile, warnings. Fill the README template as best you can; use \"_Not detected from repo._\" where unknown.";

function chatTemperature(fallback: number): number | undefined {
  const raw = process.env.OPENAI_TEMPERATURE?.trim();
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

async function runDocwrightAgentChat(
  session: LimitedMcpSession,
  input: AgentGenerateInput,
  openai: LlmClient,
): Promise<GenerateDocsOutput> {
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
  let largeTree = false;
  const warnings = [...session.getWarnings()];
  let forcedFinalOnce = false;

  for (let round = 0; round < input.limits.maxToolRounds; round++) {
    const forceFinal = shouldForceFinal({
      round,
      maxRounds: input.limits.maxToolRounds,
      calledTree,
      filesRead: session.getFilesReadCount(),
      maxFiles: input.limits.maxFilesRead,
      largeTree,
    });

    if (forceFinal && !forcedFinalOnce) {
      messages.push({ role: "user", content: FINAL_JSON_INSTRUCTION });
      forcedFinalOnce = true;
      warnings.push("Forced final JSON (tool budget / enough context).");
    }

    let toolChoice: ChatCompletionToolChoiceOption = "auto";
    if (!forceFinal) {
      toolChoice =
        round === 0
          ? { type: "function", function: { name: "get_repository_tree" } }
          : "auto";
    }

    const completion = await openai.chat.completions.create({
      model: resolveLlmModel(),
      ...(chatTemperature(0.2) !== undefined
        ? { temperature: chatTemperature(0.2) }
        : {}),
      messages,
      ...(forceFinal
        ? { response_format: { type: "json_object" as const } }
        : { tools: openAiTools, tool_choice: toolChoice }),
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
        const capped = truncateToolResult(name, text);
        text = capped.text;
        if (capped.truncated) {
          warnings.push(`Truncated tool result: ${name}`);
          if (name === "get_repository_tree") largeTree = true;
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

    return buildAgentOutput(
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

export async function runDocwrightAgent(
  session: LimitedMcpSession,
  input: AgentGenerateInput,
): Promise<GenerateDocsOutput> {
  const openai = createLlmClient();
  if (usesResponsesApi()) {
    debugLog("agent", "using Responses API path");
    return runDocwrightAgentResponses(session, input, openai);
  }
  debugLog("agent", "using Chat Completions path");
  return runDocwrightAgentChat(session, input, openai);
}
