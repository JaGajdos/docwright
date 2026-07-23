import type { DocwrightLimits } from "./types.js";

function intEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function boolEnv(name: string): boolean | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return undefined;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return undefined;
}

const HARD_DEFAULTS: DocwrightLimits = {
  maxFilesRead: 8,
  maxFileBytes: 40_000,
  maxTotalBytes: 200_000,
  maxToolRounds: 8,
  treeRecursive: true,
  maxArchitectureNodes: 12,
  maxToolResultChars: 12_000,
  maxFileToolsPerRound: 3,
};

/**
 * Resolve limits: call overrides → env → agent.json → hard defaults.
 */
export function getLimits(
  overrides: Partial<DocwrightLimits> = {},
  fileDefaults: Partial<DocwrightLimits> = {},
): DocwrightLimits {
  return {
    maxFilesRead:
      overrides.maxFilesRead ??
      intEnv("DOCWRIGHT_MAX_FILES_READ") ??
      fileDefaults.maxFilesRead ??
      HARD_DEFAULTS.maxFilesRead,
    maxFileBytes:
      overrides.maxFileBytes ??
      intEnv("DOCWRIGHT_MAX_FILE_BYTES") ??
      fileDefaults.maxFileBytes ??
      HARD_DEFAULTS.maxFileBytes,
    maxTotalBytes:
      overrides.maxTotalBytes ??
      intEnv("DOCWRIGHT_MAX_TOTAL_BYTES") ??
      fileDefaults.maxTotalBytes ??
      HARD_DEFAULTS.maxTotalBytes,
    maxToolRounds:
      overrides.maxToolRounds ??
      intEnv("DOCWRIGHT_MAX_TOOL_ROUNDS") ??
      fileDefaults.maxToolRounds ??
      HARD_DEFAULTS.maxToolRounds,
    treeRecursive:
      overrides.treeRecursive ??
      boolEnv("DOCWRIGHT_TREE_RECURSIVE") ??
      fileDefaults.treeRecursive ??
      HARD_DEFAULTS.treeRecursive,
    maxArchitectureNodes:
      overrides.maxArchitectureNodes ??
      intEnv("DOCWRIGHT_MAX_ARCHITECTURE_NODES") ??
      fileDefaults.maxArchitectureNodes ??
      HARD_DEFAULTS.maxArchitectureNodes,
    maxToolResultChars:
      overrides.maxToolResultChars ??
      intEnv("DOCWRIGHT_MAX_TOOL_RESULT_CHARS") ??
      fileDefaults.maxToolResultChars ??
      HARD_DEFAULTS.maxToolResultChars,
    maxFileToolsPerRound:
      overrides.maxFileToolsPerRound ??
      intEnv("DOCWRIGHT_MAX_FILE_TOOLS_PER_ROUND") ??
      fileDefaults.maxFileToolsPerRound ??
      HARD_DEFAULTS.maxFileToolsPerRound,
  };
}
