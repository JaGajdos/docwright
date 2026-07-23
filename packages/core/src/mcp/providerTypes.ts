import type { McpSession, McpToolName } from "./types.js";

/** Built-in MCP provider ids. More can be registered at runtime. */
export type McpProviderId = "github" | (string & {});

export type CreateMcpSessionOptions = {
  /** Override token / auth for this request */
  token?: string;
};

/**
 * Pluggable MCP backend. Register via `registerMcpProvider`.
 * At request time Docwright picks one by explicit id or by repo URL host.
 */
export type McpProvider = {
  id: McpProviderId | string;
  /** Tools this backend exposes to the agent */
  tools: readonly McpToolName[];
  /**
   * Hostnames this provider owns (lowercase, no port), e.g. `github.com`.
   * Used to auto-select the provider from a repo URL.
   */
  hosts: readonly string[];
  /**
   * Optional custom matcher (e.g. self-hosted GitLab).
   * If omitted, matching is `hosts` only.
   */
  matches?(repoInput: string): boolean;
  createSession(options?: CreateMcpSessionOptions): Promise<McpSession>;
};

export type ResolveMcpProviderOptions = {
  /** Force this provider id (wins over URL / env) */
  providerId?: string;
  /** Repo URL or `owner/repo` — used to pick provider by host */
  repoUrl?: string;
};
