/**
 * Re-export MCP session / provider API.
 */
export {
  createGithubMcpSession,
  resolveGithubMcpLaunchConfig,
  resolveMcpLaunchConfig,
  githubMcpProvider,
} from "./githubProvider.js";
export type { McpLaunchConfig } from "./githubProvider.js";
export {
  createMcpProvider,
  createMcpSession,
  resolveMcpProvider,
  registerMcpProvider,
  unregisterMcpProvider,
  listMcpProviders,
  getMcpProvider,
} from "./createProvider.js";
export { extractRepoHost } from "./repoHost.js";
export type {
  CreateMcpSessionOptions,
  McpProvider,
  McpProviderId,
  ResolveMcpProviderOptions,
} from "./providerTypes.js";
