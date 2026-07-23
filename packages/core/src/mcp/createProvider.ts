import { githubMcpProvider } from "./githubProvider.js";
import type { McpProvider, ResolveMcpProviderOptions } from "./providerTypes.js";
import { extractRepoHost } from "./repoHost.js";

const registry = new Map<string, McpProvider>();

/** Register (or replace) an MCP provider available for URL / id selection. */
export function registerMcpProvider(provider: McpProvider): void {
  if (!provider.id?.trim()) {
    throw new Error("MCP provider must have a non-empty id.");
  }
  registry.set(provider.id.toLowerCase(), provider);
}

export function unregisterMcpProvider(id: string): boolean {
  return registry.delete(id.toLowerCase());
}

export function listMcpProviders(): McpProvider[] {
  return [...registry.values()];
}

export function getMcpProvider(id: string): McpProvider | undefined {
  return registry.get(id.toLowerCase());
}

function ensureBuiltinsRegistered(): void {
  if (!registry.has("github")) {
    registerMcpProvider(githubMcpProvider);
  }
}

function providerMatches(provider: McpProvider, repoInput: string, host: string): boolean {
  if (provider.matches?.(repoInput)) return true;
  const hosts = provider.hosts.map((h) => h.replace(/^www\./, "").toLowerCase());
  return hosts.includes(host);
}

/**
 * Pick MCP provider for this request:
 * 1. Explicit `providerId` (or DOCWRIGHT_MCP_PROVIDER when no repo URL)
 * 2. Else match registered provider by repo URL host (`owner/repo` → github.com)
 */
export function resolveMcpProvider(
  options: ResolveMcpProviderOptions = {},
): McpProvider {
  ensureBuiltinsRegistered();

  const forced =
    options.providerId?.trim() ||
    (!options.repoUrl
      ? process.env.DOCWRIGHT_MCP_PROVIDER?.trim()
      : undefined);

  if (forced) {
    const found = getMcpProvider(forced);
    if (!found) {
      const known = listMcpProviders()
        .map((p) => p.id)
        .join(", ");
      throw new Error(
        `Unknown MCP provider "${forced}". Registered: ${known || "(none)"}.`,
      );
    }
    return found;
  }

  if (options.repoUrl?.trim()) {
    const host = extractRepoHost(options.repoUrl);
    const match = listMcpProviders().find((p) =>
      providerMatches(p, options.repoUrl!, host),
    );
    if (match) return match;

    const registered = listMcpProviders()
      .map((p) => `${p.id} [${p.hosts.join(", ")}]`)
      .join("; ");
    throw new Error(
      `No MCP provider registered for host "${host}". Registered: ${registered || "(none)"}.`,
    );
  }

  // No URL and no explicit id → env default or github
  const fromEnv = process.env.DOCWRIGHT_MCP_PROVIDER?.trim() || "github";
  const fallback = getMcpProvider(fromEnv);
  if (!fallback) {
    throw new Error(
      `Unknown DOCWRIGHT_MCP_PROVIDER="${fromEnv}". Registered: ${listMcpProviders()
        .map((p) => p.id)
        .join(", ")}.`,
    );
  }
  return fallback;
}

/** @deprecated Prefer resolveMcpProvider — kept for older call sites. */
export function createMcpProvider(
  options: { providerId?: string; repoUrl?: string } = {},
): McpProvider {
  return resolveMcpProvider(options);
}

/** Open a session for the provider resolved from id and/or repo URL. */
export async function createMcpSession(options?: {
  providerId?: string;
  repoUrl?: string;
  token?: string;
}): Promise<ReturnType<McpProvider["createSession"]>> {
  const provider = resolveMcpProvider({
    providerId: options?.providerId,
    repoUrl: options?.repoUrl,
  });
  return provider.createSession({ token: options?.token });
}

// Built-in: GitHub is always registered.
registerMcpProvider(githubMcpProvider);
