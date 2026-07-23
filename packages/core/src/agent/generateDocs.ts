import { getLimits } from "../limits.js";
import { createGithubMcpSession } from "../mcp/session.js";
import { withFileReadLimit } from "../mcp/types.js";
import type { GithubMcpSession } from "../mcp/types.js";
import { parseRepoInput } from "../parseRepo.js";
import { loadReadmeTemplate } from "../template.js";
import type { DocwrightLimits, GenerateDocsOutput } from "../types.js";
import { AgentLimitError, runDocwrightAgent } from "./runAgent.js";

export type GenerateDocsInput = {
  /** `owner/repo` or GitHub URL */
  repo: string;
  ref?: string;
  language?: string;
  limits?: Partial<DocwrightLimits>;
  sha?: string;
  templatePath?: string;
  /** Inject session for tests */
  mcpSession?: GithubMcpSession;
};

export { AgentLimitError };

/**
 * Full generate pipeline: parse → MCP session → OpenAI agent → docs.
 */
export async function generateDocs(
  input: GenerateDocsInput,
): Promise<GenerateDocsOutput> {
  const parsed = parseRepoInput(input.repo);
  if (!parsed.ok) {
    const err = new Error(parsed.message) as Error & { code: string };
    err.code = parsed.code;
    throw err;
  }

  const ref = input.ref ?? parsed.value.ref;
  const limits = getLimits(input.limits);
  const template = await loadReadmeTemplate(input.templatePath);

  const baseSession = input.mcpSession ?? (await createGithubMcpSession());
  const session = withFileReadLimit(baseSession, limits);

  try {
    return await runDocwrightAgent(session, {
      owner: parsed.value.owner,
      repo: parsed.value.repo,
      ref,
      language: input.language ?? "en",
      template,
      limits,
      sha: input.sha,
    });
  } finally {
    await session.close();
  }
}
