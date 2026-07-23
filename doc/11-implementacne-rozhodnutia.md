# Implementačné rozhodnutia

Uzavreté voľby pred kódom. Nadväzuje na [`04`](./04-ziskanie-obsahu-github.md)–[`10`](./10-prevadzka-mvp.md).

Default šablóna súbor: [`../templates/readme.md`](../templates/readme.md).

---

## 1. Package manager — **npm workspaces**

```json
{
  "private": true,
  "workspaces": ["packages/*", "apps/*", "action"]
}
```

- **npm** (nie pnpm/yarn) — bez ďalšieho toolu, Railway/Actions majú npm default.
- Lockfile: `package-lock.json` commitnúť.

---

## 2. MCP na Railway — **stdio child process** (nie Docker)

| | **stdio child** (zvolené) | Docker sidecar |
|--|---------------------------|----------------|
| Setup na Railway | Jednoduchší (1 service) | Image + Docker vrstva |
| Latencia / ops | Nižšia komplexita | Ťažšie debug |
| Oficiálny server | Spustiť binárku / `npx` / Go build ako child | `docker run ghcr.io/github/github-mcp-server` |

**Rozhodnutie:** API/core spustí **GitHub MCP ako stdio child** cez MCP SDK (`StdioClientTransport`).

Default spawn (keď nie je `DOCWRIGHT_MCP_COMMAND`):
```bash
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
```
(oficiálny image; stále stdio z pohľadu Node klienta — nie samostatný Docker sidecar service.)

Override: `DOCWRIGHT_MCP_COMMAND=github-mcp-server` (binárka na PATH).

---

## 3. Agent loop (uzavreté)

### 3.1 Model
- OpenAI ChatGPT, default `gpt-4o-mini` (env `OPENAI_MODEL`).
- Tool-calling API (nie jeden slepý prompt bez tools).

### 3.2 Limity slučky

| Parameter | Default |
|-----------|---------|
| `max_tool_rounds` | **12** |
| `max_files_read` | **25** (z `04`) |
| Po vyčerpaní rounds bez finálneho README | chyba `502` / `AGENT_LIMIT` |

Jeden „round“ = model odpoveď + prípadné tool calls + tool results späť do modelu.

### 3.3 Tools (schéma pre model)

Agent smie volať **iba** tieto MCP tools (mapované 1:1):

**`get_repository_tree`**
```json
{
  "name": "get_repository_tree",
  "description": "Get file/directory tree of a public GitHub repo",
  "parameters": {
    "owner": "string",
    "repo": "string",
    "tree_sha": "string (optional ref)",
    "recursive": "boolean (default true)"
  }
}
```

**`get_file_contents`**
```json
{
  "name": "get_file_contents",
  "description": "Get contents of a file (or directory listing) in the repo",
  "parameters": {
    "owner": "string",
    "repo": "string",
    "path": "string",
    "ref": "string (optional)"
  }
}
```

Žiadne iné tools v MVP (žiadny web search, žiadny shell).

### 3.4 Povinné poradie správania
1. Zavolať `get_repository_tree` pre dané `owner/repo`.
2. Podľa priority z `04` volať `get_file_contents` (do limitu).
3. Až potom vyproduovať **finálny výstup** (bez ďalších tools).

### 3.5 System prompt (kanonický text)

```text
You are Docwright, an onboarding docs agent.

Goal: For one public GitHub repository, produce:
1) A README filled from the provided Markdown template (placeholders like {{project_name}}).
2) A one-screen architecture map as Mermaid flowchart (max 12 nodes).

Rules:
- Use ONLY the tools get_repository_tree and get_file_contents via GitHub MCP.
- Always fetch the file tree first.
- Do not invent scripts, APIs, or modules that are not supported by tool results; use "_Not detected from repo._" instead.
- Merge useful facts from an existing README into the template structure.
- Keep sections short and clean. Prefer Quick start and Architecture.
- Output language: {{language}} (default English).
- When done, respond with a single JSON object (no markdown fences) with keys:
  readmeMarkdown (string),
  architectureMermaid (string, raw mermaid without fences),
  architectureMarkdownFile (string),
  warnings (string array).
- architectureMermaid must be a flowchart (TB or LR), max 12 nodes.
- If Mermaid would be invalid, still return best-effort mermaid; server may retry/fix.
```

Placeholdery `{{language}}` doplní runtime.  
Template body pošle user/system ako príloha (obsah `templates/readme.md`).

### 3.6 Mermaid retry
Ak server-side validácia Mermaid zlyhá: **1×** follow-up call len na opravu `architectureMermaid` (bez tools), potom text fallback (`05`).

---

## 4. Mermaid vo webe — knižnica **`mermaid`**

| Voľba | Verdikt |
|-------|---------|
| **`mermaid` (npm)** | **Zvolené** — oficiálne, jednoduché `mermaid.render` / `run` vo Vite |
| `@mermaid-js/mermaid` alias | to isté |
| mermaid.ink / CDN only | horšie offline/build |

Frontend (`apps/web`):
- dependency `mermaid`
- po generate: render `architectureMermaid` do `<div>` / SVG
- pri chybe renderu: ukázať raw text / fallback z API

README markdown: jednoduchý renderer napr. **`marked`** + sanitizácia **`DOMPurify`** (alebo `marked` + basic escape) — nie súčasť Mermaid rozhodnutia, ale odporúčané duo pre README panel.

---

## 5. Sticky PR comment — GitHub API flow

Marker: `<!-- docwright-bot -->` (prvých riadkov body).

```
1. POST Railway /v1/generate → get prCommentMarkdown (or build from response)
2. GET /repos/{owner}/{repo}/issues/{pr_number}/comments
   (paginate if needed)
3. Find comment where body includes "<!-- docwright-bot -->"
   AND comment.user.type is Bot or login matches github-actions[bot] / app
4. If found:
     PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}
     { "body": newBody }
   Else:
     POST /repos/{owner}/{repo}/issues/{pr_number}/comments
     { "body": newBody }
```

Auth: `GITHUB_TOKEN` z Action (`pull-requests: write`).  
Idempotencia: jeden Docwright komentár na PR; `synchronize` = update toho istého.

---

## 6. Acceptance

- [ ] `templates/readme.md` existuje a agent ho používa ako default
- [ ] Agent: max 12 tool rounds; len 2 MCP tools; system prompt §3.5
- [ ] MCP na Railway ako **stdio child**
- [ ] Web: `mermaid` na render mapy
- [ ] Action: sticky flow §5
- [ ] Monorepo: **npm workspaces** + `package-lock.json`

**Stav:** uzavreté pre implementáciu.
