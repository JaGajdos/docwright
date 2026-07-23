# Docwright

The docs your repo never got around to writing.

Point Docwright at a **public** GitHub repo → clean README + one-screen architecture map.

## Architecture

```
Browser (GitHub Pages) ──POST /v1/generate──► Railway API
                                              ├── OpenAI agent
                                              └── GitHub MCP (stdio)

GitHub Action ──► same Railway API ──► sticky PR comment
```

| Surface | Role |
|---------|------|
| `apps/web` | End-user UI (no login) |
| `apps/api` | Public API + rate limit |
| `packages/core` | Agent + MCP + template |
| `action/` | Sticky PR comment client |

## Local

```bash
cp .env.example .env   # OPENAI_API_KEY, GITHUB_TOKEN, …
npm ci
npm test
npm run dev:api        # :8787
npm run dev:web        # :5173  (VITE_API_URL defaults to localhost:8787)
npm run generate -- owner/repo
```

## Deploy

Krok za krokom (Azure, Railway, Pages, secrets): **[`doc/12-instalacna-prirucka.md`](./doc/12-instalacna-prirucka.md)**

- Backend: Railway (`Dockerfile` / `railway.toml`) — Agent + MCP
- Frontend: GitHub Pages (`.github/workflows/deploy-pages.yml`)
- Action example: `.github/workflows/docwright-pr.yml`

Secrets: LLM + GitHub MCP token **only on Railway**. Action needs `DOCWRIGHT_API_URL` + `DOCWRIGHT_API_KEY`.

## Spec

- [`doc/`](./doc/) — SDD
- [`slices/`](./slices/) — implementation slices
- [`templates/readme.md`](./templates/readme.md) — default README template
