# Získanie obsahu GitHub projektu

Špecifikácia podľa [`../zadanie.txt`](../zadanie.txt) — **bez rozšírenia scope**.  
SDD: tech spec ingest + agent.

> **Quick start (zadanie):** *Connect the GitHub MCP, have the agent read one repo’s file tree, and generate a README from a template.*

---

## 1. Čo zadanie vyžaduje (ingest)

| Bod zadania | Význam |
|-------------|---------|
| Public GitHub repo | Vstup = public repository |
| **GitHub MCP** | Agent načítava tree/súbory **cez MCP** |
| Agent read **file tree** | Povinný prvý krok |
| AI agent | Tool-calling (MCP tools) + generate README/mapy |

**Kde to reálne beží:** na **Railway** (backend) — pozri [`09`](./09-nasadenie.md).  
Web a Public API volajú ten istý agent+MCP stack. Nie je to len Cursor demo.

---

## 2. Scope

### In scope
- Oficiálny **GitHub MCP** (default provider) + **AI agent** na Railway
- **MCP provider registry** — výber podľa hostu URL / `DOCWRIGHT_MCP_PROVIDER` / `mcpProvider` v API
- Agent: `get_repository_tree` → výber súborov → `get_file_contents` (limity z `config/agent.json`)
- Výstup kontextu do generate ([`05`](./05-readme-a-architecture-map.md))

### Out of scope
- Privátne repá
- Quality / security scannery
- Ingest **bez** MCP na web/API path (REST-only generate pre produkt = zakázané)
- Ďalšie VCS MCP backendy (GitLab, …) — registry API áno, implementácia mimo MVP

---

## 3. Vstup

```text
public GitHub repo  →  owner + repo
voliteľne: ref (branch), inak default branch
```

Formy: `https://github.com/owner/repo` alebo `owner/repo`.

---

## 4. Runtime: Agent + MCP na Railway

```
POST /v1/generate  (Railway)
        │
        ▼
  AI agent (OpenAI tool-calling)
        │
        ├── tool: get_repository_tree   ← GitHub MCP
        ├── tool: get_file_contents     ← GitHub MCP (≤ limity)
        └── potom: vyplní README template + Mermaid (05)
```

1. API prijme `owner/repo` (+ optional `ref`).
2. Spustí agenta pripojeného na **github/github-mcp-server** (proces na Railway alebo Docker sidecar).
3. Agent **povinne** načíta file tree cez MCP.
4. Agent načíta obsah súborov podľa priority (§7.3) a limitov (§7.2).
5. Agent vygeneruje README + architecture map ([`05`](./05-readme-a-architecture-map.md)).

**GitHub Action** neimplementuje vlastný ingest — volá Railway `/v1/generate` (ten istý Agent+MCP), potom sticky komentár ([`06`](./06-dorucenie-action-api.md)).

---

## 5. MCP server / tools

| Položka | Hodnota |
|---------|---------|
| Server | **[github/github-mcp-server](https://github.com/github/github-mcp-server)** |
| Auth MCP | `GITHUB_TOKEN` / PAT (public repo + vyšší rate limit) |
| Tools | `get_repository_tree` (povinné), `get_file_contents` |

---

## 6. Default limity (konfigurovateľné)

Zdroj pravdy: [`config/agent.json`](../config/agent.json) + env `DOCWRIGHT_MAX_*`  
(priorita: call override → env → `agent.json` → hard defaults v `packages/core`).

| Parameter | Default | Env |
|-----------|---------|-----|
| `maxFilesRead` | **8** | `DOCWRIGHT_MAX_FILES_READ` |
| `maxFileBytes` | **40_000** | `DOCWRIGHT_MAX_FILE_BYTES` |
| `maxTotalBytes` | **200_000** | `DOCWRIGHT_MAX_TOTAL_BYTES` |
| `maxToolRounds` | **8** | `DOCWRIGHT_MAX_TOOL_ROUNDS` |
| `treeRecursive` | **true** | `DOCWRIGHT_TREE_RECURSIVE` |
| `maxArchitectureNodes` | **12** | `DOCWRIGHT_MAX_ARCHITECTURE_NODES` |
| `maxToolResultChars` | **12_000** | `DOCWRIGHT_MAX_TOOL_RESULT_CHARS` |
| `maxFileToolsPerRound` | **3** | `DOCWRIGHT_MAX_FILE_TOOLS_PER_ROUND` |

Priorita súborov: README/LICENSE → manifests → entry points → ostatné.  
Veľké tree výsledkov sa truncujú (priority paths first).

---

## 6b. MCP providery (pluggable)

Ingest ide cez **MCP provider registry** (`packages/core/src/mcp/`):

1. Explicitné `mcpProvider` v requeste / `DOCWRIGHT_MCP_PROVIDER`
2. Inak výber podľa **hostu z repo URL** (`owner/repo` → `github.com`)
3. Default: **`github`** (oficiálny GitHub MCP)

Ďalšie backendy (GitLab, …): `registerMcpProvider({ id, hosts, createSession })` — pozri [`packages/core/src/mcp/README.md`](../packages/core/src/mcp/README.md).  
MVP implementuje len GitHub; `parseRepoInput` zatiaľ akceptuje len github.com.

---

## 7. Výstup pre generate

| Položka | Zdroj |
|---------|--------|
| File tree | MCP `get_repository_tree` |
| Obsahy súborov | MCP `get_file_contents` |
| Identita | `owner`, `repo`, `ref` |

---

## 8. Acceptance

- [ ] Na Railway beží **Agent + oficiálny GitHub MCP**
- [ ] Každý web/API generate ide cez MCP tree + files (nie čistý REST bypass)
- [ ] Limity konfigurovateľné
- [ ] Action používa ten istý Railway generate (MCP)

**Stav:** uzavreté. Generate: [`05`](./05-readme-a-architecture-map.md) · Deploy: [`09`](./09-nasadenie.md).
