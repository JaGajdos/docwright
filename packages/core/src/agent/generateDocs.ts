import { getLimits } from "../limits.js";
import { createGithubMcpSession } from "../mcp/session.js";
import { withFileReadLimit } from "../mcp/types.js";
import type { GithubMcpSession } from "../mcp/types.js";
import { parseRepoInput } from "../parseRepo.js";
import { loadReadmeTemplate } from "../template.js";
import type { DocwrightLimits, GenerateDocsOutput } from "../types.js";
import { debugLog, errorLog } from "../debug.js";
import {
  usesAzureOpenAI,
  usesResponsesApi,
  resolveLlmModel,
} from "./llmClient.js";
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
  const t0 = Date.now();
  debugLog("generate", "start", {
    repo: input.repo,
    ref: input.ref,
    language: input.language,
    llmApi: usesResponsesApi() ? "responses" : "chat",
    azure: usesAzureOpenAI(),
    model: resolveLlmModel(),
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? null,
    endpointSet: Boolean(process.env.AZURE_OPENAI_ENDPOINT?.trim()),
  });

  const parsed = parseRepoInput(input.repo);
  if (!parsed.ok) {
    const err = new Error(parsed.message) as Error & { code: string };
    err.code = parsed.code;
    throw err;
  }
  debugLog("generate", "parsed", parsed.value);

  const ref = input.ref ?? parsed.value.ref;
  const limits = getLimits(input.limits);
  debugLog("generate", "limits", limits);

  const template = await loadReadmeTemplate(input.templatePath);
  debugLog("generate", "template loaded", { chars: template.length });

  debugLog("generate", "MCP session connecting…");
  let baseSession: GithubMcpSession;
  try {
    baseSession = input.mcpSession ?? (await createGithubMcpSession());
    debugLog("generate", "MCP session ready", {
      ms: Date.now() - t0,
      injected: Boolean(input.mcpSession),
    });
  } catch (err) {
    errorLog("generate", err, { stage: "mcp_connect" });
    throw err;
  }

  const session = withFileReadLimit(baseSession, limits);

  try {
    debugLog("generate", "agent starting…");
    const out = await runDocwrightAgent(session, {
      owner: parsed.value.owner,
      repo: parsed.value.repo,
      ref,
      language: input.language ?? "en",
      template,
      limits,
      sha: input.sha,
    });
    debugLog("generate", "done", {
      ms: Date.now() - t0,
      readmeChars: out.readmeMarkdown.length,
      mermaidChars: out.architectureMermaid.length,
      warnings: out.warnings.length,
    });
    return out;
  } catch (err) {
    errorLog("generate", err, {
      stage: "agent",
      ms: Date.now() - t0,
      owner: parsed.value.owner,
      repo: parsed.value.repo,
    });
    throw err;
  } finally {
    await session.close();
    debugLog("generate", "MCP session closed");
  }
}
