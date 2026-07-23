import type { FunctionTool } from "openai/resources/responses/responses.js";
import type { LimitedMcpSession } from "../mcp/types.js";
import type { GenerateDocsOutput } from "../types.js";
import { createLlmClient, resolveLlmModel, type LlmClient } from "./llmClient.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import {
  AgentLimitError,
  type AgentGenerateInput,
  buildAgentOutput,
  extractJsonObject,
  shouldForceFinal,
} from "./agentShared.js";

const responseTools: FunctionTool[] = [
  {
    type: "function",
    name: "get_repository_tree",
    description: "Get file/directory tree of a public GitHub repo",
    strict: false,
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
      additionalProperties: true,
    },
  },
  {
    type: "function",
    name: "get_file_contents",
    description: "Get contents of a file in the repo",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        ref: { type: "string" },
      },
      required: ["owner", "repo", "path"],
      additionalProperties: true,
    },
  },
];

const FINAL_JSON_INSTRUCTION =
  "STOP calling tools. Based only on tool results already in this conversation, respond with ONLY one JSON object (no markdown fences) with keys: readmeMarkdown, architectureMermaid, architectureMarkdownFile, warnings. Fill the README template as best you can; use \"_Not detected from repo._\" where unknown.";

const ALLOWED = new Set(["get_repository_tree", "get_file_contents"]);

function outputText(response: {
  output_text?: string;
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
}): string {
  if (response.output_text?.trim()) return response.output_text.trim();
  const parts: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message" || !item.content) continue;
    for (const c of item.content) {
      if (c.type === "output_text" && c.text) parts.push(c.text);
      if ((c as { type: string }).type === "text" && c.text) parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

/**
 * Azure gpt-5.6-* deployments use Responses API (/openai/responses), not chat.completions.
 */
export async function runDocwrightAgentResponses(
  session: LimitedMcpSession,
  input: AgentGenerateInput,
  openai: LlmClient = createLlmClient(),
): Promise<GenerateDocsOutput> {
  const language = input.language ?? "en";
  const model = resolveLlmModel();
  const instructions = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt({
    owner: input.owner,
    repo: input.repo,
    ref: input.ref,
    template: input.template,
  });

  let calledTree = false;
  const warnings = [...session.getWarnings()];
  let previousResponseId: string | undefined;
  let nextInput: string | Array<Record<string, unknown>> = userPrompt;
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
      // Append as new user turn via input array when continuing
      if (previousResponseId) {
        nextInput = [{ role: "user", content: FINAL_JSON_INSTRUCTION }];
      } else {
        nextInput = `${userPrompt}\n\n${FINAL_JSON_INSTRUCTION}`;
      }
      forcedFinalOnce = true;
      warnings.push("Forced final JSON (Responses API / tool budget).");
    }

    const response = await openai.responses.create({
      model,
      instructions,
      input: nextInput as never,
      ...(previousResponseId
        ? { previous_response_id: previousResponseId }
        : {}),
      store: true,
      ...(forceFinal
        ? {
            tool_choice: "none" as const,
            text: { format: { type: "json_object" as const } },
          }
        : {
            tools: responseTools,
            tool_choice:
              round === 0 && !previousResponseId
                ? ({ type: "function", name: "get_repository_tree" } as const)
                : ("auto" as const),
          }),
    });

    previousResponseId = response.id;

    const functionCalls = (response.output ?? []).filter(
      (item): item is Extract<(typeof response.output)[number], { type: "function_call" }> =>
        item.type === "function_call",
    );

    if (functionCalls.length > 0 && !forceFinal) {
      const toolOutputs: Array<{
        type: "function_call_output";
        call_id: string;
        output: string;
      }> = [];

      for (const call of functionCalls) {
        const name = call.name;
        if (!ALLOWED.has(name)) {
          toolOutputs.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify({
              error: "TOOL_NOT_ALLOWED",
              message: `Tool ${name} is not allowed.`,
            }),
          });
          continue;
        }

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.arguments || "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }
        args.owner = input.owner;
        args.repo = input.repo;
        if (name === "get_repository_tree") {
          calledTree = true;
          if (input.ref && args.tree_sha === undefined) args.tree_sha = input.ref;
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

        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: text,
        });
      }

      warnings.push(...session.getWarnings());
      nextInput = toolOutputs;
      continue;
    }

    const text = outputText(response);
    const parsed = extractJsonObject(text);
    if (!parsed?.readmeMarkdown) {
      nextInput = [
        {
          role: "user",
          content: forcedFinalOnce
            ? "Your last reply was not valid JSON with readmeMarkdown. Return ONLY the JSON object now."
            : FINAL_JSON_INSTRUCTION,
        },
      ];
      forcedFinalOnce = true;
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
