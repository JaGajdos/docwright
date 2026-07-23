import type { ParseRepoResult, RepoRef } from "./types.js";

const OWNER_REPO = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/([a-zA-Z0-9._-]+)$/;

function stripGitSuffix(name: string): string {
  return name.endsWith(".git") ? name.slice(0, -4) : name;
}

function fail(message: string): ParseRepoResult {
  return { ok: false, code: "INVALID_REPO", message };
}

/**
 * Parse `owner/repo` or `https://github.com/owner/repo[/tree/ref…]`.
 */
export function parseRepoInput(input: string): ParseRepoResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return fail("Repository input is empty.");
  }

  // Short form: owner/repo
  if (!trimmed.includes("://") && !trimmed.startsWith("github.com/")) {
    const m = OWNER_REPO.exec(trimmed);
    if (!m) {
      return fail(
        "Expected owner/repo or a github.com URL (public repository).",
      );
    }
    return {
      ok: true,
      value: { owner: m[1], repo: stripGitSuffix(m[2]) },
    };
  }

  let url: URL;
  try {
    const withProto = trimmed.startsWith("github.com/")
      ? `https://${trimmed}`
      : trimmed;
    url = new URL(withProto);
  } catch {
    return fail("Invalid repository URL.");
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    return fail("Only github.com URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return fail("URL must include owner and repository name.");
  }

  const owner = parts[0];
  const repo = stripGitSuffix(parts[1]);
  if (!OWNER_REPO.test(`${owner}/${repo}`)) {
    return fail("Invalid owner or repository name.");
  }

  const value: RepoRef = { owner, repo };

  // /tree/<ref>/... or /commit/<sha> or /blob/<ref>/...
  if (parts[2] === "tree" || parts[2] === "blob" || parts[2] === "commit") {
    if (parts[3]) {
      value.ref = decodeURIComponent(parts[3]);
    }
  }

  return { ok: true, value };
}
