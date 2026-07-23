export type RepoRef = {
  owner: string;
  repo: string;
  /** Branch, tag, or omit for default */
  ref?: string;
};

export type DocwrightLimits = {
  maxFilesRead: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxToolRounds: number;
  treeRecursive: boolean;
  maxArchitectureNodes: number;
  /** Truncate MCP tool results before sending to the LLM */
  maxToolResultChars: number;
  /** Max get_file_contents calls executed per model turn */
  maxFileToolsPerRound: number;
};

export type GenerateDocsOutput = {
  readmeMarkdown: string;
  architectureMermaid: string;
  architectureMarkdownFile: string;
  architectureFallbackText?: string;
  warnings: string[];
  prCommentMarkdown: string;
};

export type ParseRepoSuccess = { ok: true; value: RepoRef };
export type ParseRepoFailure = {
  ok: false;
  code: "INVALID_REPO";
  message: string;
};
export type ParseRepoResult = ParseRepoSuccess | ParseRepoFailure;
