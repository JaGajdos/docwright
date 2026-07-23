# Docwright

The docs your repo never got around to writing.

Point Docwright at a **public** GitHub repo → clean README + one-screen architecture map.

## Architecture

```
Browser (GitHub Pages) ──POST /v1/generate──► Railway API
                                              ├── LLM provider (openai / azure / …)
                                              └── MCP provider (default: github stdio)

GitHub Action ──► same Railway API ──► sticky PR comment
```

| Surface | Role |
|---------|------|
| `apps/web` | End-user UI (no login; EN/SK) |
| `apps/api` | Public API + rate limit |
| `packages/core` | Agent + pluggable LLM/MCP + template |
| `config/` | Agent limits + prompts (`agent.json`, `prompts/*.md`) |
| `action/` | Sticky PR comment client |

## Local

```bash
cp .env.example .env   # OPENAI_API_KEY / Azure, GITHUB_TOKEN, …
npm ci
npm test
npm run dev:api        # :8787
npm run dev:web        # :5173  (VITE_API_URL defaults to localhost:8787)
npm run generate -- owner/repo
```

LLM: `DOCWRIGHT_LLM_PROVIDER` (`openai` default) — see [`packages/core/src/llm/README.md`](./packages/core/src/llm/README.md).  
MCP: host from URL → registry (default `github`) — [`packages/core/src/mcp/README.md`](./packages/core/src/mcp/README.md).

## Deploy

Krok za krokom (Azure, Railway, Pages, secrets): **[`doc/12-instalacna-prirucka.md`](./doc/12-instalacna-prirucka.md)**

- Backend: Railway (`Dockerfile` / `railway.toml`) — Agent + MCP  
  *(Railway nie je v kóde natvrdo — iný host: [`doc/09` §2.7](./doc/09-nasadenie.md#27-iný-backend-host-nie-railway))*
- Frontend: GitHub Pages (`.github/workflows/deploy-pages.yml`)
- Action example: `.github/workflows/docwright-pr.yml`

Secrets: LLM + GitHub MCP token **only on the API host**. Action needs `DOCWRIGHT_API_URL` + `DOCWRIGHT_API_KEY`.

## Spec

- [`doc/`](./doc/) — SDD
- [`slices/`](./slices/) — implementation slices
- [`templates/readme.md`](./templates/readme.md) — default README template
- [`config/`](./config/) — editable agent limits + prompts
