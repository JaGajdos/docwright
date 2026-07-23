import { getLocale, t, type Locale } from "./i18n.js";

const CODE_TO_KEY = {
  INVALID_REPO: "errInvalidRepo",
  REPO_INACCESSIBLE: "errRepoInaccessible",
  RATE_LIMITED: "errRateLimited",
  TIMEOUT: "errTimeout",
  LLM_UNAVAILABLE: "errLlm",
  MCP_UNAVAILABLE: "errMcp",
  AGENT_LIMIT: "errAgentLimit",
  UNAUTHORIZED: "errUnauthorized",
  JSON_PARSE: "errJson",
} as const;

export function userMessageForError(
  err: unknown,
  locale: Locale = getLocale(),
): string {
  const code = (err as Error & { code?: string })?.code;
  if (code && code in CODE_TO_KEY) {
    return t(CODE_TO_KEY[code as keyof typeof CODE_TO_KEY], locale);
  }
  if (err instanceof Error && err.message === "JSON_PARSE") {
    return t("errJson", locale);
  }
  if (err instanceof TypeError) {
    return t("errNetwork", locale);
  }
  if (err instanceof Error && err.message) return err.message;
  return t("errGeneric", locale);
}
