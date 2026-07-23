import type { DocwrightLimits } from "../types.js";

/** Tools the Docwright agent may call via MCP. */
export type McpToolName = "get_repository_tree" | "get_file_contents";

export type McpToolCallResult = {
  text: string;
  isError?: boolean;
};

/**
 * Active MCP session (any backend). Provider-agnostic name.
 */
export interface McpSession {
  callTool(
    name: McpToolName,
    args: Record<string, unknown>,
  ): Promise<McpToolCallResult>;
  close(): Promise<void>;
}

/** @deprecated Prefer `McpSession` — alias kept for older imports. */
export type GithubMcpSession = McpSession;

export type LimitedMcpSession = McpSession & {
  getFilesReadCount(): number;
  getWarnings(): string[];
};

/**
 * Wrap session to enforce max_files_read on get_file_contents.
 */
export function withFileReadLimit(
  session: McpSession,
  limits: DocwrightLimits,
): LimitedMcpSession {
  let filesRead = 0;
  const warnings: string[] = [];

  return {
    async callTool(name, args) {
      if (name === "get_file_contents") {
        if (filesRead >= limits.maxFilesRead) {
          warnings.push(
            `Skipped get_file_contents (limit ${limits.maxFilesRead} reached).`,
          );
          return {
            text: JSON.stringify({
              error: "FILE_READ_LIMIT",
              message: `Max files read (${limits.maxFilesRead}) reached. Do not fetch more files; produce the final JSON now.`,
            }),
            isError: true,
          };
        }
        filesRead += 1;
      }
      return session.callTool(name, args);
    },
    async close() {
      return session.close();
    },
    getFilesReadCount: () => filesRead,
    getWarnings: () => [...warnings],
  };
}
