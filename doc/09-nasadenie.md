# Nasadenie + inštalácia (GitHub Pages + Railway)

Špecifikácia deployu a **čo nakonfigurovať** na GitHub a Railway.  
**Krok-za-krokom postup (hackathon):** [`12-instalacna-prirucka.md`](./12-instalacna-prirucka.md).  
Architektúra: Agent + GitHub MCP beží na **Railway** ([`04`](./04-ziskanie-obsahu-github.md)).

---

## 1. Cieľová architektúra

```
  Používateľ ──► GitHub Pages (frontend)
                      │
                      ▼ POST /v1/generate
                 Railway
                 ├── apps/api (HTTP)
                 ├── AI agent (LLM provider: openai / azure / …)
                 └── MCP provider (default: github stdio)
                      │
  GH Action ──────────┘  (volá API, potom sticky PR comment)
```

| Komponent | Hosting | Default URL |
|-----------|---------|-------------|
| Frontend | **GitHub Pages** | `https://<user>.github.io/<repo>/` |
| Backend (Agent+MCP) | **Railway** (default MVP) | `https://<service>.up.railway.app` |
| Custom doména | **Nie** (MVP) | — |

> **Portabilita BE:** Railway **nie je** natvrdo v aplikačnom kóde. API je bežný Node/Hono server (`PORT`) + `Dockerfile`. Web a Action berú len URL z env (`VITE_API_URL`, `DOCWRIGHT_API_URL`). Rovnaký image ide na Fly.io, Render, Cloud Run, VPS, … — pozri §2.7.

---

## 2. Čo nainštalovať / nastaviť — Railway

### 2.1 Účet a projekt
1. Vytvoriť účet na [railway.app](https://railway.app).
2. **New Project** → Deploy from **GitHub repo** (pripojiť GitHub OAuth, vybrať Docwright repo).
3. Root / service: `apps/api` (alebo Dockerfile v rooti, ktorý spúšťa API + MCP).

### 2.2 Runtime
- Node.js 20+ (Railway detekcia z `package.json`) **alebo** Docker image, ak MCP beží cez `docker run ghcr.io/github/github-mcp-server`.
- Pri štarte API: spawn MCP ako **stdio child** ([`11`](./11-implementacne-rozhodnutia.md)); Docker sidecar v MVP nie.
- Start command: spustí API (MCP child štartuje z kódu).

### 2.3 Variables (Railway → Variables)

| Premenná | Povinné | Popis |
|----------|---------|--------|
| `OPENAI_API_KEY` | Áno | OpenAI / Azure / compatible API key |
| `DOCWRIGHT_LLM_PROVIDER` | Nie | `openai` (default) \| `azure` \| `openai-compatible` — [`llm/README`](../packages/core/src/llm/README.md) |
| `AZURE_OPENAI_ENDPOINT` | Azure | Ak nastavené + provider `openai`/`azure` → Azure Responses |
| `AZURE_OPENAI_API_VERSION` | Azure | napr. `2025-04-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | Azure | deployment name |
| `DOCWRIGHT_LLM_API` | Nie | `chat` \| `responses` (Azure default `responses`) |
| `OPENAI_MODEL` | Nie | Len public OpenAI / compatible; default `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Nie | Pre `openai-compatible` (Ollama, Groq, …) |
| `GITHUB_TOKEN` | Áno | PAT pre GitHub MCP (public repo read) |
| `DOCWRIGHT_MCP_PROVIDER` | Nie | Default `github` — výber aj podľa hostu URL |
| `DOCWRIGHT_MCP_COMMAND` / `ARGS` | Nie | Override spawn MCP binárky |
| `DOCWRIGHT_API_KEY` | Áno | Key pre Action / externé volania (nie pre browser) |
| `CORS_ORIGINS` | Áno | Presná Pages URL, napr. `https://<user>.github.io` |
| `DOCWRIGHT_MAX_FILES_READ` | Nie | Default **8** (`config/agent.json`) |
| `DOCWRIGHT_MAX_FILE_BYTES` | Nie | Default **40000** |
| `DOCWRIGHT_MAX_TOOL_ROUNDS` | Nie | Default **8** |
| `DOCWRIGHT_RATE_LIMIT_PER_HOUR` | Nie | Default 5 |
| `DOCWRIGHT_RATE_LIMIT_PER_DAY` | Nie | Default 20 |
| `PORT` | Auto | Railway nastaví |

Limity + prompty: [`config/`](../config/) — detail v [`12`](./12-instalacna-prirucka.md).

### 2.4 GitHub token pre MCP (ako vytvoriť)
1. GitHub → **Settings → Developer settings → Personal access tokens**.
2. Classic PAT s `public_repo` **alebo** fine-grained: read contents na public (prípadne no expiry / dlhá platnosť na hackathon).
3. Vložiť ako `GITHUB_TOKEN` na Railway (**nie** commitnúť do gitu).

### 2.5 Overenie
- Po deployi: `POST https://<service>.up.railway.app/v1/generate` s body `{"repo":"owner/repo"}` (z Tools/curl).
- Z browseru (Pages origin) musí prejsť CORS.

### 2.6 Networking
- Public HTTPS URL (Railway default).
- Timeout služby dostatočný na sync generate (120 s).

### 2.7 Iný backend host (nie Railway)

Aplikačný kód **neviaže** Docwright na Railway (žiadny Railway SDK, žiadna hardcodovaná `*.up.railway.app` URL).

| Čo | Prenosné |
|----|----------|
| Runtime | `Dockerfile` alebo `npm run start` + Node 20 |
| Konfig | tie isté env ako §2.3 |
| Klienti | `VITE_API_URL` / `DOCWRIGHT_API_URL` = nová public HTTPS base URL |
| CORS | `CORS_ORIGINS` = Pages origin |
| `railway.toml` | len pre Railway; inde sa ignoruje |

**Požiadavky na host:**
1. **Dlhé sync HTTP** (~60–120 s) — serverless s krátkym timeoutom (typický edge / krátky function limit) je nevhodný.
2. **Child process** — GitHub MCP beží ako stdio child vedľa API (container / VM; nie „pure“ edge bez process spawn).

Príklady: Fly.io, Render, Google Cloud Run, Azure Container Apps, vlastný VPS. Po deployi prepíš `VITE_API_URL`, `DOCWRIGHT_API_URL`, `CORS_ORIGINS` a redeploy Pages / Action secrets.

---

## 3. Čo nainštalovať / nastaviť — GitHub (Pages + CI)

### 3.1 GitHub Pages (frontend)
1. Repo → **Settings → Pages**.
2. Source: **GitHub Actions** (odporúčané) alebo branch `gh-pages`.
3. Workflow `deploy-pages.yml` na `push` do `main`:
   - build `apps/web` (`npm run build`)
   - upload Pages artifact / deploy
4. Build-time env:
   - `VITE_API_URL=https://<service>.up.railway.app`  
     (v GitHub Actions: **Settings → Secrets and variables → Actions** → `VITE_API_URL` alebo Variable).

### 3.2 Secrets v Docwright repo (pre deploy Pages + PR Action na vlastnom repo)

| Secret | Kde | Účel |
|--------|-----|------|
| `VITE_API_URL` | Actions variables/secrets | Build frontendu |
| `DOCWRIGHT_API_URL` | Actions secrets | PR workflow volá Railway |
| `DOCWRIGHT_API_KEY` | Actions secrets | Bearer na Railway |
| `OPENAI_API_KEY` | **Nie** v Pages; len Railway | — |
| `GITHUB_TOKEN` (MCP) | **Nie** v Actions pre MCP; len Railway | — |

`GITHUB_TOKEN` v Action jobe = automatický token na **komentár PR**, nie ten istý ako MCP PAT na Railway.

### 3.3 Workflow: deploy Pages (orientačne)

```yaml
# .github/workflows/deploy-pages.yml
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci && npm run build --workspace=apps/web
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL }}
      # + configure-pages / upload-pages-artifact / deploy-pages
```

### 3.4 Workflow: Docwright na PR (v Docwright repo alebo klientskom repo)

```yaml
# .github/workflows/docwright-pr.yml
on:
  pull_request:
    types: [opened, reopened, synchronize]
permissions:
  contents: read
  pull-requests: write
jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: ./action   # alebo owner/repo/action@main
        with:
          api-url: ${{ secrets.DOCWRIGHT_API_URL }}
          api-key: ${{ secrets.DOCWRIGHT_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 3.5 Inštalácia Action u cudzieho tímu (klientsky repo)
1. Pridať workflow súbor (skopírovať example).
2. Secrets: `DOCWRIGHT_API_URL`, `DOCWRIGHT_API_KEY` (dostanú od prevádzkovateľa Docwright / z Railway).
3. Netreba `OPENAI_API_KEY` v klientskom repo — generate beží na Railway.

---

## 4. Checklist prvého spustenia

### Railway
- [ ] Repo connected, service beží
- [ ] `OPENAI_API_KEY`, `GITHUB_TOKEN` (MCP), `DOCWRIGHT_API_KEY`, `CORS_ORIGINS`
- [ ] MCP proces štartuje spolu s API
- [ ] Ručný `POST /v1/generate` OK

### GitHub Pages
- [ ] Pages zapnuté
- [ ] `VITE_API_URL` = Railway URL
- [ ] Deploy workflow zelený
- [ ] V browsri: URL → Generate → README + mapa (bez loginu)

### GitHub Action
- [ ] `docwright-pr.yml` v repo
- [ ] Secrets `DOCWRIGHT_API_URL` + `DOCWRIGHT_API_KEY`
- [ ] Test PR → sticky komentár

---

## 5. Acceptance

- [ ] Pages + Railway default URL (bez custom domény)
- [ ] Generate na Railway = **Agent + MCP**
- [ ] Secrets rozdelené: LLM/MCP na Railway; Action len API URL+key
- [ ] CORS Pages → Railway
- [ ] Demo použiteľné bez prihlásenia

**Stav:** uzavreté.

---

## 6. Rozhodnutia

| # | Rozhodnutie |
|---|-------------|
| 1 | Backend default: **Railway** (Agent + MCP + API); **nie** hardcodované — iný host podľa §2.7 |
| 2 | Frontend: **GitHub Pages** |
| 3 | Default URL len |
| 4 | Action → backend API URL (žiadny samostatný OpenAI v Action) |
| 5 | Inštalačné kroky §2–§4 sú súčasť spec |
