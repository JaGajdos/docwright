import type { DocwrightLimits } from "./types.js";

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return fallback;
}

/** Defaults from doc/04 and doc/11 — overridable via env. */
export function getLimits(
  overrides: Partial<DocwrightLimits> = {},
): DocwrightLimits {
  return {
    maxFilesRead: overrides.maxFilesRead ?? intEnv("DOCWRIGHT_MAX_FILES_READ", 8),
    maxFileBytes:
      overrides.maxFileBytes ?? intEnv("DOCWRIGHT_MAX_FILE_BYTES", 40_000),
    maxTotalBytes:
      overrides.maxTotalBytes ?? intEnv("DOCWRIGHT_MAX_TOTAL_BYTES", 200_000),
    maxToolRounds:
      overrides.maxToolRounds ?? intEnv("DOCWRIGHT_MAX_TOOL_ROUNDS", 8),
    treeRecursive:
      overrides.treeRecursive ?? boolEnv("DOCWRIGHT_TREE_RECURSIVE", true),
    maxArchitectureNodes:
      overrides.maxArchitectureNodes ??
      intEnv("DOCWRIGHT_MAX_ARCHITECTURE_NODES", 12),
  };
}
