import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DocwrightLimits } from "./types.js";

export type AgentPromptFiles = {
  system: string;
  user: string;
  final: string;
};

export type AgentFileConfig = {
  limits?: Partial<DocwrightLimits>;
  prompts?: Partial<{
    system: string;
    user: string;
    final: string;
  }>;
};

export type LoadedAgentConfig = {
  configPath: string;
  limits: Partial<DocwrightLimits>;
  prompts: AgentPromptFiles;
};

const DEFAULT_PROMPTS: AgentPromptFiles = {
  system: `You are Docwright, an onboarding docs agent.

Goal: For one public GitHub repository, produce:
1) A README filled from the provided Markdown template (placeholders like {{project_name}}).
2) A one-screen architecture map as Mermaid flowchart (max {{max_architecture_nodes}} nodes).

Rules:
- Use ONLY the tools get_repository_tree and get_file_contents via GitHub MCP.
- Always fetch the file tree first.
- Do not invent scripts, APIs, or modules that are not supported by tool results; use "_Not detected from repo._" instead.
- Merge useful facts from an existing README into the template structure.
- Keep sections short and clean. Prefer Quick start and Architecture.
- Output language: {{language}} (default English).
- When done, respond with a single JSON object (no markdown fences) with keys:
  readmeMarkdown (string),
  architectureMermaid (string, raw mermaid without fences),
  architectureMarkdownFile (string),
  warnings (string array).
- architectureMermaid must be a flowchart (TB or LR), max {{max_architecture_nodes}} nodes.
- Prefer reading README, manifests, and entry points before other files.
- For large repositories: after the tree, read at most 2–3 key files, then STOP tools and emit final JSON.`,
  user: `Generate onboarding docs for GitHub repo {{owner}}/{{repo}} ({{ref_line}}).

Fill this README template (keep all section headings; replace placeholders):

----- TEMPLATE START -----
{{template}}
----- TEMPLATE END -----

Put the Mermaid diagram into {{architecture_map}} as a fenced mermaid block inside readmeMarkdown, and also return raw mermaid in architectureMermaid.
architectureMarkdownFile should be a short markdown file containing the diagram.`,
  final:
    'STOP calling tools. Based only on tool results already in this conversation, respond with ONLY one JSON object (no markdown fences) with keys: readmeMarkdown, architectureMermaid, architectureMarkdownFile, warnings. Fill the README template as best you can; use "_Not detected from repo._" where unknown.',
};

function packageDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/** Replace only known keys; leave other `{{placeholders}}` untouched. */
export function fillAgentPlaceholders(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{\{([a-z_]+)\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    return match;
  });
}

export async function resolveAgentConfigPath(
  explicit?: string,
): Promise<string> {
  if (explicit) return path.resolve(explicit);
  const fromEnv = process.env.DOCWRIGHT_AGENT_CONFIG?.trim();
  if (fromEnv) return path.resolve(fromEnv);

  const candidates = [
    path.resolve(process.cwd(), "config", "agent.json"),
    path.resolve(packageDir(), "..", "..", "..", "config", "agent.json"),
    path.resolve(packageDir(), "..", "..", "config", "agent.json"),
  ];

  for (const c of candidates) {
    try {
      await access(c);
      return c;
    } catch {
      /* next */
    }
  }
  return candidates[0];
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function resolveMaybeRelative(baseDir: string, p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(baseDir, p);
}

/**
 * Load `config/agent.json` + prompt markdown files.
 * Missing files fall back to built-in defaults (tests / broken deploys).
 */
export async function loadAgentConfig(
  explicitPath?: string,
): Promise<LoadedAgentConfig> {
  const configPath = await resolveAgentConfigPath(explicitPath);
  const raw = await readOptionalFile(configPath);

  let file: AgentFileConfig = {};
  if (raw) {
    try {
      file = JSON.parse(raw) as AgentFileConfig;
    } catch (err) {
      throw new Error(
        `Invalid agent config JSON at ${configPath}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  // Paths in agent.json are relative to repo root (cwd), not the config file dir —
  // except when the path is already absolute.
  const rootDir = process.cwd();
  const configDir = path.dirname(configPath);

  const systemPath = resolveMaybeRelative(
    rootDir,
    file.prompts?.system ?? "config/prompts/system.md",
  );
  const userPath = resolveMaybeRelative(
    rootDir,
    file.prompts?.user ?? "config/prompts/user.md",
  );
  const finalPath = resolveMaybeRelative(
    rootDir,
    file.prompts?.final ?? "config/prompts/final.md",
  );

  // Also try next to agent.json if cwd-relative miss (e.g. running from packages/core)
  const readPrompt = async (
    primary: string,
    fallbackName: keyof AgentPromptFiles,
  ): Promise<string> => {
    const a = await readOptionalFile(primary);
    if (a !== null) return a;
    const beside = path.join(configDir, "..", "prompts", `${fallbackName}.md`);
    const b = await readOptionalFile(beside);
    if (b !== null) return b;
    const underConfig = path.join(configDir, "prompts", `${fallbackName}.md`);
    const c = await readOptionalFile(underConfig);
    if (c !== null) return c;
    return DEFAULT_PROMPTS[fallbackName];
  };

  return {
    configPath,
    limits: file.limits ?? {},
    prompts: {
      system: (await readPrompt(systemPath, "system")).trim(),
      user: (await readPrompt(userPath, "user")).trim(),
      final: (await readPrompt(finalPath, "final")).trim(),
    },
  };
}
