import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { GithubMcpSession, McpToolCallResult, McpToolName } from "./types.js";

export type McpLaunchConfig = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

function envWithToken(token: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  env.GITHUB_PERSONAL_ACCESS_TOKEN = token;
  env.GITHUB_TOKEN = token;
  return env;
}

/**
 * Resolve how to spawn official GitHub MCP (stdio).
 * Override with DOCWRIGHT_MCP_COMMAND / DOCWRIGHT_MCP_ARGS (JSON array).
 * Default: docker run -i ghcr.io/github/github-mcp-server
 * Or DOCWRIGHT_MCP_COMMAND=github-mcp-server if binary is on PATH.
 */
export function resolveMcpLaunchConfig(
  githubToken: string,
): McpLaunchConfig {
  const command = process.env.DOCWRIGHT_MCP_COMMAND?.trim();
  const argsRaw = process.env.DOCWRIGHT_MCP_ARGS?.trim();

  if (command) {
    let args: string[] = [];
    if (argsRaw) {
      try {
        args = JSON.parse(argsRaw) as string[];
      } catch {
        args = argsRaw.split(/\s+/).filter(Boolean);
      }
    }
    return {
      command,
      args,
      env: envWithToken(githubToken),
    };
  }

  // Default: Docker image of official server (stdio via -i)
  return {
    command: "docker",
    args: [
      "run",
      "-i",
      "--rm",
      "-e",
      "GITHUB_PERSONAL_ACCESS_TOKEN",
      "ghcr.io/github/github-mcp-server",
    ],
    env: envWithToken(githubToken),
  };
}

function contentToText(result: {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}): McpToolCallResult {
  const parts = (result.content ?? [])
    .map((c) => (c.type === "text" && c.text ? c.text : JSON.stringify(c)))
    .filter(Boolean);
  return {
    text: parts.join("\n") || JSON.stringify(result),
    isError: Boolean(result.isError),
  };
}

export async function createGithubMcpSession(
  githubToken?: string,
): Promise<GithubMcpSession> {
  const token =
    githubToken ||
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
    process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN is required for GitHub MCP.",
    );
  }

  const launch = resolveMcpLaunchConfig(token);
  const transport = new StdioClientTransport({
    command: launch.command,
    args: launch.args,
    env: launch.env,
    stderr: "pipe",
  });

  const client = new Client({ name: "docwright", version: "0.1.0" });
  await client.connect(transport);

  return {
    async callTool(name: McpToolName, args: Record<string, unknown>) {
      const result = await client.callTool({ name, arguments: args });
      return contentToText(
        result as {
          content?: Array<{ type: string; text?: string }>;
          isError?: boolean;
        },
      );
    },
    async close() {
      await client.close();
      await transport.close();
    },
  };
}
