const MESSAGES: Record<string, string> = {
  INVALID_REPO: "Skontroluj adresu repa (public GitHub).",
  REPO_INACCESSIBLE: "Repo sa nenašlo alebo nie je public.",
  RATE_LIMITED: "Príliš veľa požiadaviek. Skús neskôr.",
  TIMEOUT: "Dočasný problém. Skús znova.",
  LLM_UNAVAILABLE: "Dočasný problém. Skús znova.",
  MCP_UNAVAILABLE: "GitHub MCP nedostupný. Skontroluj GITHUB_TOKEN na Railway.",
  AGENT_LIMIT: "Dočasný problém. Skús znova.",
  UNAUTHORIZED: "Dočasný problém. Skús znova.",
};

export function userMessageForError(err: unknown): string {
  const code = (err as Error & { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (err instanceof TypeError) {
    return "Nepodarilo sa spojiť s API. Beží Docwright API?";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Dočasný problém. Skús znova.";
}
