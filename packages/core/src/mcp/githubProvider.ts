import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { debugLog } from "../debug.js";
import type { McpProvider } from "./providerTypes.js";
import type { McpSession, McpToolCallResult, McpToolName } from "./types.js";

export type McpLaunchConfig = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

const GITHUB_TOOLS = [
  "get_repository_tree",
  "get_file_contents",
] as const satisfies readonly McpToolName[];

function envWithToken(token: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  env.GITHUB_PERSONAL_ACCESS_TOKEN = token;
  env.GITHUB_TOKEN = token;
  if (!env.GITHUB_TOOLSETS?.trim()) {
    env.GITHUB_TOOLSETS = "repos,git";
  }
  if (!env.GITHUB_TOOLS?.trim()) {
    env.GITHUB_TOOLS = GITHUB_TOOLS.join(",");
  }
  return env;
}

/**
 * Resolve how to spawn official GitHub MCP (stdio).
 * Override with DOCWRIGHT_MCP_COMMAND / DOCWRIGHT_MCP_ARGS (JSON array).
 */
export function resolveGithubMcpLaunchConfig(githubToken: string): McpLaunchConfig {
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
    } else if (/github-mcp-server/i.test(command)) {
      args = ["stdio"];
    }
    return {
      command,
      args,
      env: envWithToken(githubToken),
    };
  }

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

/** @deprecated Use resolveGithubMcpLaunchConfig */
export function resolveMcpLaunchConfig(githubToken: string): McpLaunchConfig {
  return resolveGithubMcpLaunchConfig(githubToken);
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
): Promise<McpSession> {
  const token =
    githubToken ||
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
    process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN is required for GitHub MCP.",
    );
  }

  const launch = resolveGithubMcpLaunchConfig(token);
  const transport = new StdioClientTransport({
    command: launch.command,
    args: launch.args,
    env: launch.env,
    stderr: "pipe",
  });

  const client = new Client({ name: "docwright", version: "0.1.0" });
  try {
    debugLog("mcp", "spawning", {
      provider: "github",
      command: launch.command,
      args: launch.args,
      toolsets: launch.env?.GITHUB_TOOLSETS,
      tools: launch.env?.GITHUB_TOOLS,
    });
    await client.connect(transport);
    debugLog("mcp", "connected", { provider: "github" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `GitHub MCP failed to start (${launch.command} ${launch.args.join(" ")}): ${msg}. Check GITHUB_TOKEN and DOCWRIGHT_MCP_* on Railway.`,
    );
  }

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

export const githubMcpProvider: McpProvider = {
  id: "github",
  tools: GITHUB_TOOLS,
  hosts: ["github.com", "www.github.com"],
  createSession(options) {
    return createGithubMcpSession(options?.token);
  },
};
