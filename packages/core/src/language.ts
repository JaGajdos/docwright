/**
 * Human-readable output language for LLM prompts.
 * Codes like `en` / `sk` alone are easy for the model to ignore.
 */
export function resolveOutputLanguage(code: string | undefined): {
  code: string;
  label: string;
  notDetected: string;
} {
  const normalized = (code ?? "en").trim().toLowerCase() || "en";
  if (normalized === "sk" || normalized.startsWith("sk-")) {
    return {
      code: "sk",
      label: "Slovak (slovenčina)",
      notDetected: "_V repo nezistené._",
    };
  }
  return {
    code: "en",
    label: "English",
    notDetected: "_Not detected from repo._",
  };
}
