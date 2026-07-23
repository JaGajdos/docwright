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
- Oficiálny **GitHub MCP** + **AI agent** na Railway
- Agent: `get_repository_tree` → výber súborov → `get_file_contents` (limity)
- Výstup kontextu do generate ([`05`](./05-readme-a-architecture-map.md))

### Out of scope
- Privátne repá
- Quality / security scannery
- Ingest **bez** MCP na web/API path (REST-only generate pre produkt = zakázané)

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

| Parameter | Default | Účel |
|-----------|---------|------|
| `max_files_read` | **25** | Max `get_file_contents` |
| `max_file_bytes` | **100_000** | Truncate / skip |
| `max_total_bytes` | **800_000** | Soft cap kontextu |
| `tree_recursive` | **true** | File tree |

Priorita súborov: README/LICENSE → manifests → entry points → ostatné.

Env príklady: `DOCWRIGHT_MAX_FILES_READ`, …

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
