import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LimitedMcpSession } from "../mcp/types.js";
import { getLimits } from "../limits.js";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("openai", () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: createMock,
      },
    };
  }
  return {
    default: MockOpenAI,
    OpenAI: MockOpenAI,
    AzureOpenAI: MockOpenAI,
  };
});

import { runDocwrightAgent } from "./runAgent.js";

function emptySession(
  onTool?: (name: string) => { text: string; isError?: boolean },
): LimitedMcpSession & { toolCalls: string[] } {
  const toolCalls: string[] = [];
  return {
    toolCalls,
    async callTool(name) {
      toolCalls.push(name);
      return onTool?.(name) ?? { text: "ok" };
    },
    async close() {},
    getFilesReadCount: () =>
      toolCalls.filter((t) => t === "get_file_contents").length,
    getWarnings: () => [],
  };
}

describe("runDocwrightAgent (mocked OpenAI + MCP)", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    createMock.mockReset();
  });

  it("calls tree tool then returns final JSON", async () => {
    const session = emptySession((name) => ({
      text: name === "get_repository_tree" ? "README.md\nsrc/" : "content",
    }));

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "1",
                type: "function",
                function: {
                  name: "get_repository_tree",
                  arguments: JSON.stringify({ owner: "o", repo: "r" }),
                },
              },
            ],
          },
        },
      ],
    });

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              readmeMarkdown:
                "# Demo\n\nHi\n\n## What it is\n\nX\n\n## Quick start\n\nY\n",
              architectureMermaid: "flowchart TB\n  A --> B",
              architectureMarkdownFile: "# Architecture\n",
              warnings: [],
            }),
          },
        },
      ],
    });

    const out = await runDocwrightAgent(session, {
      owner: "o",
      repo: "r",
      template: "# {{project_name}}\n{{architecture_map}}",
      limits: getLimits({ maxToolRounds: 5 }),
      language: "en",
    });

    expect(session.toolCalls[0]).toBe("get_repository_tree");
    expect(out.readmeMarkdown).toContain("# Demo");
    expect(out.architectureMermaid).toContain("flowchart TB");
    expect(out.prCommentMarkdown).toContain("docwright-bot");
  });

  it("uses tree → files order and preserves README fact in model context", async () => {
    const FACT = "UNIQUE_FACT_DOCWRIGHT_42";
    const session = emptySession((name) => {
      if (name === "get_repository_tree") return { text: "README.md" };
      return { text: `# Old\n\n${FACT}\n` };
    });

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "t1",
                type: "function",
                function: {
                  name: "get_repository_tree",
                  arguments: JSON.stringify({ owner: "o", repo: "r" }),
                },
              },
            ],
          },
        },
      ],
    });

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "t2",
                type: "function",
                function: {
                  name: "get_file_contents",
                  arguments: JSON.stringify({
                    owner: "o",
                    repo: "r",
                    path: "README.md",
                  }),
                },
              },
            ],
          },
        },
      ],
    });

    createMock.mockImplementationOnce(async (req: { messages: Array<{ content?: string | null }> }) => {
      const blob = JSON.stringify(req.messages);
      expect(blob).toContain(FACT);
      return {
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                readmeMarkdown: `# New\n\nKeeps ${FACT}\n\n## What it is\n\nApp\n\n## Quick start\n\nnpm i\n`,
                architectureMermaid: "flowchart LR\n  A --> B",
                architectureMarkdownFile: "# Architecture\n",
                warnings: [],
              }),
            },
          },
        ],
      };
    });

    const out = await runDocwrightAgent(session, {
      owner: "o",
      repo: "r",
      template: "# {{project_name}}",
      limits: getLimits({ maxToolRounds: 8 }),
    });

    expect(session.toolCalls).toEqual([
      "get_repository_tree",
      "get_file_contents",
    ]);
    expect(out.readmeMarkdown).toContain(FACT);
  });

  it("falls back to text when Mermaid repair fails", async () => {
    const session = emptySession();

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "1",
                type: "function",
                function: {
                  name: "get_repository_tree",
                  arguments: JSON.stringify({ owner: "o", repo: "r" }),
                },
              },
            ],
          },
        },
      ],
    });

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              readmeMarkdown: "# Demo\n\n## What it is\n\nX\n",
              architectureMermaid: "this is not valid mermaid at all",
              architectureMarkdownFile: "",
              warnings: [],
            }),
          },
        },
      ],
    });

    // repairMermaid call — still invalid
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: "still broken diagram",
          },
        },
      ],
    });

    const out = await runDocwrightAgent(session, {
      owner: "o",
      repo: "r",
      template: "# {{project_name}}\n{{architecture_map}}",
      limits: getLimits({ maxToolRounds: 5 }),
    });

    expect(out.architectureMermaid).toBe("");
    expect(out.architectureFallbackText).toContain("textual map");
    expect(out.warnings.some((w) => w.includes("Mermaid fallback"))).toBe(true);
  });

  it("truncates oversized file contents", async () => {
    const session = emptySession((name) => {
      if (name === "get_repository_tree") return { text: "big.txt" };
      return { text: "x".repeat(500) };
    });

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "1",
                type: "function",
                function: {
                  name: "get_repository_tree",
                  arguments: JSON.stringify({ owner: "o", repo: "r" }),
                },
              },
            ],
          },
        },
      ],
    });

    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "2",
                type: "function",
                function: {
                  name: "get_file_contents",
                  arguments: JSON.stringify({
                    owner: "o",
                    repo: "r",
                    path: "big.txt",
                  }),
                },
              },
            ],
          },
        },
      ],
    });

    createMock.mockImplementationOnce(async (req: { messages: Array<{ role: string; content?: string | null }> }) => {
      const toolMsg = [...req.messages].reverse().find((m) => m.role === "tool");
      expect(toolMsg?.content).toContain("[truncated: file exceeded maxFileBytes]");
      return {
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                readmeMarkdown: "# Demo\n",
                architectureMermaid: "flowchart TB\n  A --> B",
                architectureMarkdownFile: "# A\n",
                warnings: [],
              }),
            },
          },
        ],
      };
    });

    const out = await runDocwrightAgent(session, {
      owner: "o",
      repo: "r",
      template: "# {{project_name}}",
      limits: getLimits({ maxToolRounds: 8, maxFileBytes: 50 }),
    });

    expect(out.warnings.some((w) => w.includes("Truncated"))).toBe(true);
  });
});
