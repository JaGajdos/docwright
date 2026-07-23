import type { DocwrightLimits } from "../types.js";

export type McpToolName = "get_repository_tree" | "get_file_contents";

export type McpToolCallResult = {
  text: string;
  isError?: boolean;
};

export interface GithubMcpSession {
  callTool(
    name: McpToolName,
    args: Record<string, unknown>,
  ): Promise<McpToolCallResult>;
  close(): Promise<void>;
}

export type LimitedMcpSession = GithubMcpSession & {
  getFilesReadCount(): number;
  getWarnings(): string[];
};

/**
 * Wrap session to enforce max_files_read on get_file_contents.
 */
export function withFileReadLimit(
  session: GithubMcpSession,
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
