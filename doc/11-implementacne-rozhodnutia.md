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

## 2. MCP na Railway — **stdio child process** + provider registry

| | **stdio child** (zvolené) | Docker sidecar |
|--|---------------------------|----------------|
| Setup na Railway | Jednoduchší (1 service) | Image + Docker vrstva |
| Latencia / ops | Nižšia komplexita | Ťažšie debug |
| Oficiálny server | Spustiť binárku / image ako child | Samostatný Docker service |

**Rozhodnutie:** API/core spustí MCP ako **stdio child** cez MCP SDK (`StdioClientTransport`).

Default spawn GitHub (keď nie je `DOCWRIGHT_MCP_COMMAND`):
```bash
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
```
(oficiálny image; stále stdio z pohľadu Node klienta.)

Override: `DOCWRIGHT_MCP_COMMAND=/usr/local/bin/github-mcp-server` + `DOCWRIGHT_MCP_ARGS=["stdio"]` (Dockerfile na Railway).

### 2.1 MCP provider registry

| | |
|--|--|
| API | `registerMcpProvider` / `resolveMcpProvider` / `createMcpSession` |
| Výber | 1) explicit `mcpProvider` · 2) host z URL · 3) `DOCWRIGHT_MCP_PROVIDER` · 4) `github` |
| Implementované | **`github`** (`github.com`) |
| Rozšírenie | nový provider + `hosts: ["gitlab.com", …]` — [`mcp/README.md`](../packages/core/src/mcp/README.md) |

---

## 3. Agent loop (uzavreté)

### 3.1 LLM — pluggable provider (default GPT)

| `DOCWRIGHT_LLM_PROVIDER` | Poznámka |
|--------------------------|----------|
| `openai` (**default**) | Public OpenAI, alebo Azure ak je `AZURE_OPENAI_ENDPOINT` |
| `azure` | Vynútený Azure OpenAI |
| `openai-compatible` | `OPENAI_BASE_URL` (Ollama, Groq, vLLM, …) — Chat Completions |

| Položka | Hodnota |
|---------|---------|
| Public OpenAI model | `OPENAI_MODEL` default `gpt-4o-mini` |
| Azure | `AZURE_OPENAI_*` + Responses API (`DOCWRIGHT_LLM_API=responses` default pri Azure) |
| Agent API | `chat` (tool-calling) alebo `responses` (Azure gpt-5.6-*) |

Detail: [`packages/core/src/llm/README.md`](../packages/core/src/llm/README.md).

### 3.2 Limity slučky

| Parameter | Default |
|-----------|---------|
| `maxToolRounds` | **8** |
| `maxFilesRead` | **8** |
| `maxToolResultChars` | **12_000** |
| Po vyčerpaní rounds bez finálneho README | `AGENT_LIMIT` / 502 |

Jeden „round“ = model odpoveď + prípadné tool calls + tool results späť do modelu.  
Pri veľkom tree: skorší force-final (budget).

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

### 3.5 System / user / final prompty (súbory)

Kanonický text **nie je** len v tomto dokumente — žije v:

| Súbor | Účel |
|-------|------|
| [`config/prompts/system.md`](../config/prompts/system.md) | systémové pravidlá (`{{language}}`, `{{max_architecture_nodes}}`, …) |
| [`config/prompts/user.md`](../config/prompts/user.md) | user prompt + README template |
| [`config/prompts/final.md`](../config/prompts/final.md) | force-final JSON |
| [`config/agent.json`](../config/agent.json) | limity + cesty k promptom |

Placeholdery a priorita limitov: [`config/README.md`](../config/README.md).

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
- [ ] Agent: limity z `config/agent.json` (default max **8** tool rounds); len 2 MCP tools; prompty v `config/prompts/`
- [ ] MCP: stdio child + provider registry (default `github`)
- [ ] LLM: pluggable (`openai` / `azure` / `openai-compatible`)
- [ ] Web: `mermaid` na render mapy
- [ ] Action: sticky flow §5
- [ ] Monorepo: **npm workspaces** + `package-lock.json`

**Stav:** uzavreté pre implementáciu.
