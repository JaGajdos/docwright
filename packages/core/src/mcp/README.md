# MCP providers

Docwright reads repos through a **registry** of MCP providers. At request time
the correct one is chosen from the **repo URL host** (or an explicit id).

```
generateDocs(repo)
  → extractRepoHost(repo)     # owner/repo → github.com
  → resolveMcpProvider()      # match registered hosts
  → provider.createSession()
  → agent tools
```

## Selection order

1. Explicit `mcpProvider` / `providerId` (API / `generateDocs`)
2. Else match `registerMcpProvider({ hosts: [...] })` against the URL host  
   (`owner/repo` is treated as `github.com`)
3. Else `DOCWRIGHT_MCP_PROVIDER` / default `github`

## Built-in

| Id | Hosts | Status |
|----|-------|--------|
| `github` | `github.com` | **Implemented** (official GitHub MCP) |

## Register another provider (e.g. GitLab)

```ts
import { registerMcpProvider } from "@docwright/core";

registerMcpProvider({
  id: "gitlab",
  hosts: ["gitlab.com"],
  tools: ["get_repository_tree", "get_file_contents"],
  async createSession() {
    // spawn GitLab MCP / REST adapter…
    throw new Error("not implemented");
  },
});
```

Self-hosted: set `hosts: ["git.example.com"]` or implement `matches(repoInput)`.

Also extend `parseRepoInput` (or add a host-specific parser) before calling generate for non-GitHub URLs.

Spawn for GitHub (unchanged): `DOCWRIGHT_MCP_COMMAND`, `DOCWRIGHT_MCP_ARGS`, `GITHUB_TOKEN`.
