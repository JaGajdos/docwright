export type {
  DocwrightLimits,
  GenerateDocsOutput,
  ParseRepoResult,
  RepoRef,
} from "./types.js";
export { getLimits } from "./limits.js";
export { parseRepoInput } from "./parseRepo.js";
export {
  fillTemplate,
  listTemplatePlaceholders,
  loadReadmeTemplate,
  resolveExistingTemplatePath,
  resolveTemplatePath,
} from "./template.js";
export { summarizeReadme } from "./summarizeReadme.js";
export {
  DOCWRIGHT_BOT_MARKER,
  buildPrCommentMarkdown,
  isDocwrightBotComment,
} from "./prComment.js";
export type { PrCommentInput } from "./prComment.js";
export { generateDocs, AgentLimitError } from "./agent/generateDocs.js";
export type { GenerateDocsInput } from "./agent/generateDocs.js";
export { createGithubMcpSession, resolveMcpLaunchConfig } from "./mcp/session.js";
export { withFileReadLimit } from "./mcp/types.js";
export type { GithubMcpSession, McpToolName } from "./mcp/types.js";
export { createLlmClient, resolveLlmModel } from "./agent/llmClient.js";
export type { LlmClient } from "./agent/llmClient.js";

export const DOCWRIGHT_CORE_VERSION = "0.1.0";
