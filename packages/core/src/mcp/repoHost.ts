/**
 * Extract hostname for MCP provider routing.
 * Short `owner/repo` → github.com (implicit GitHub).
 */
export function extractRepoHost(repoInput: string): string {
  const trimmed = repoInput.trim();
  if (!trimmed) {
    throw new Error("Repository input is empty.");
  }

  // owner/repo — no host → default GitHub
  if (
    !trimmed.includes("://") &&
    !/^[\w.-]+\.[a-z]{2,}\//i.test(trimmed) &&
    !trimmed.startsWith("github.com/") &&
    !trimmed.startsWith("www.github.com/")
  ) {
    return "github.com";
  }

  let url: URL;
  try {
    const withProto = /^[\w.-]+\.[a-z]{2,}\//i.test(trimmed)
      ? `https://${trimmed}`
      : trimmed;
    url = new URL(withProto);
  } catch {
    throw new Error("Invalid repository URL.");
  }

  return url.hostname.replace(/^www\./, "").toLowerCase();
}
