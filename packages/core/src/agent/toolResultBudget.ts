/**
 * Keep LLM context small — large repos (e.g. facebook/react) otherwise
 * burn Azure rate limits with huge trees + many tool rounds.
 */

const TREE_PRIORITY =
  /(?:^|[/\s])(readme(\.\w+)?|package\.json|cargo\.toml|go\.mod|pyproject\.toml|composer\.json|tsconfig.*\.json|dockerfile|makefile|src\/|apps\/|packages\/|lib\/|cmd\/|internal\/|app\/|web\/|server\/)/i;

const DEFAULT_MAX_TOOL_CHARS = 12_000;

export function maxToolResultChars(): number {
  const raw = process.env.DOCWRIGHT_MAX_TOOL_RESULT_CHARS?.trim();
  if (!raw) return DEFAULT_MAX_TOOL_CHARS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 1000 ? n : DEFAULT_MAX_TOOL_CHARS;
}

export function truncateToolResult(
  toolName: string,
  text: string,
  maxChars = maxToolResultChars(),
): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };

  if (toolName === "get_repository_tree") {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const important = lines.filter((l) => TREE_PRIORITY.test(l));
    const rest = lines.filter((l) => !TREE_PRIORITY.test(l));
    const merged = [...important, "---", ...rest].join("\n");
    const sliced = merged.slice(0, maxChars);
    return {
      text:
        sliced +
        `\n\n[truncated tree: ${lines.length} lines total; kept priority paths + head. Produce README from this — do not fetch dozens of files.]`,
      truncated: true,
    };
  }

  return {
    text:
      text.slice(0, maxChars) +
      "\n\n[truncated: tool result exceeded max chars]",
    truncated: true,
  };
}

/** Max get_file_contents tool calls to execute per model turn (rest answered as skipped). */
export function maxFileToolsPerRound(): number {
  const raw = process.env.DOCWRIGHT_MAX_FILE_TOOLS_PER_ROUND?.trim();
  if (!raw) return 3;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}
