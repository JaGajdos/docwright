# Inštalačná príručka Docwright

Praktický postup: čo získať, kde to nastaviť, ako overiť.  
Architektúra a rozhodnutia: [`09-nasadenie.md`](./09-nasadenie.md) · [`10-prevadzka-mvp.md`](./10-prevadzka-mvp.md).

```
Browser (GitHub Pages) ──POST /v1/generate──► Railway API
                                              ├── Azure OpenAI (alebo OpenAI)
                                              └── GitHub MCP (stdio)

GitHub Action ──► Railway API ──► sticky PR komentár
```

---

## 0. Checklist (skrátene)

| # | Krok | Hotovo keď |
|---|------|------------|
| 1 | Azure / OpenAI kľúč | máš API key |
| 2 | GitHub PAT | token `ghp_…` / fine-grained |
| 3 | `DOCWRIGHT_API_KEY` | vymyslený tajný string |
| 4 | Railway deploy + Variables | service **Online** |
| 5 | Public domain na Railway | `https://….up.railway.app` vracia JSON |
| 6 | GitHub Secrets / Variables | Pages + Action |
| 7 | GitHub Pages | frontend URL funguje |
| 8 | CORS | Generate z Pages bez CORS chyby |

---

## 1. Čo získať (pred Railway)

### 1.1 LLM — Azure OpenAI (Aston hackathon)

Z tímového / Azure portálu (príklad Aston):

| Parameter | Príklad |
|-----------|---------|
| Endpoint | `https://aston-hct.openai.azure.com` |
| API version | `2024-04-01-preview` |
| Deployment | `T1-gpt-5.6-terra` |
| API key | z Azure / tímového dashboardu |

> **Nie** z [platform.openai.com](https://platform.openai.com) — to je iný produkt (public OpenAI).  
> Bez `AZURE_OPENAI_ENDPOINT` na Railway ide kód na `api.openai.com` → chyba **401 Incorrect API key**.

### 1.1b Alternatíva — public OpenAI

1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Create key (`sk-…`)
2. Na Railway **nezadávaj** `AZURE_*` premenné
3. Nastav `OPENAI_API_KEY` + voliteľne `OPENAI_MODEL=gpt-4o-mini`

### 1.2 GitHub PAT (pre MCP na Railway)

Toto **nie je** automatický `GITHUB_TOKEN` z Actions.

1. GitHub → avatar → **Settings**
2. Dole **Developer settings** → **Personal access tokens**
3. Odporúčané: **Tokens (classic)** → Generate
4. Scope: aspoň **`public_repo`** (čítanie public rep)
5. Skopíruj token (`ghp_…`) → na Railway ako `GITHUB_TOKEN`

Fine-grained: Contents = Read na public / All public repositories.

### 1.3 `DOCWRIGHT_API_KEY` (vymyslíš ty)

Nie je od OpenAI ani GitHubu. Vygeneruj náhodný string, napr. v PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Ten **istý** string dáš:
- na **Railway** ako `DOCWRIGHT_API_KEY`
- do **GitHub Actions secrets** ako `DOCWRIGHT_API_KEY`

Browser / Pages ho **nepotrebuje**.

---

## 2. Railway — backend (Agent + MCP + API)

### 2.1 Projekt

1. [railway.app](https://railway.app) → Login with GitHub
2. **New Project** → **Deploy from GitHub repo** → Docwright repo
3. Root obsahuje `Dockerfile` + `railway.toml` (Docker build API + MCP binárka)

### 2.2 Variables (Service → Variables)

Po pridaní / zmene premenných: ak je banner **staged changes** → klikni **Deploy**  
(obyčajné Redeploy zo starého deployu často **nevezme** nové variables).

#### Povinné — Azure LLM (hackathon)

| Premenná | Príklad hodnoty |
|----------|-----------------|
| `OPENAI_API_KEY` | Azure API key |
| `AZURE_OPENAI_ENDPOINT` | `https://aston-hct.openai.azure.com` |
| `AZURE_OPENAI_API_VERSION` | `2024-04-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | `T1-gpt-5.6-terra` |

#### Povinné — GitHub MCP + API

| Premenná | Príklad hodnoty |
|----------|-----------------|
| `GITHUB_TOKEN` | PAT z §1.2 |
| `DOCWRIGHT_API_KEY` | tvoj random string |
| `CORS_ORIGINS` | `https://<github-user>.github.io` (neskôr doplň; lokálne môže byť `http://localhost:5173`) |

#### Odporúčané — MCP toolsets

Bez toho MCP nevie tool `get_repository_tree` (je v toolsete `git`, nie v defaulte):

| Premenná | Hodnota |
|----------|---------|
| `GITHUB_TOOLSETS` | `repos,git` |
| `GITHUB_TOOLS` | `get_repository_tree,get_file_contents` |

*(Novší Docker image ich nastavuje defaultne; na staršom deployi ich pridaj ručne.)*

#### Voliteľné

| Premenná | Default / poznámka |
|----------|-------------------|
| `PORT` | Railway nastaví (v image default 8080) |
| `DOCWRIGHT_REQUEST_TIMEOUT_MS` | `120000` |
| `DOCWRIGHT_RATE_LIMIT_PER_HOUR` | `5` |
| `DOCWRIGHT_RATE_LIMIT_PER_DAY` | `20` |
| `DOCWRIGHT_MAX_FILES_READ` | `25` |
| `OPENAI_MODEL` | len pri **public** OpenAI (nie Azure) |

### 2.3 Public Networking (povinné)

`*.railway.internal` = **len** vnútorná sieť — **nie** pre browser / Pages / Action.

1. Service → **Settings** → **Networking** → **Public Networking**
2. Klikni **Generate Domain** (nie Custom)
3. Port: **`8080`**
4. Dostaneš: `https://<meno>-production-xxxx.up.railway.app`

### 2.4 Overenie API

V browsri otvor:

`https://TVOJA-RAILWAY-URL/`

Očakávané:

```json
{
  "name": "docwright-api",
  "version": "0.1.0",
  "endpoints": ["POST /v1/generate"]
}
```

Generate (môže trvať 1–2 min):

```powershell
curl -X POST "https://TVOJA-RAILWAY-URL/v1/generate" `
  -H "content-type: application/json" `
  -d "{\"repo\":\"sindresorhus/is\"}"
```

---

## 3. GitHub — secrets, Pages, Action

### 3.1 Kde kliknúť

Repo na GitHube → **Settings** (repo, nie profil) → **Secrets and variables** → **Actions**.

### 3.2 Secrets (Repository secrets)

| Name | Value |
|------|--------|
| `DOCWRIGHT_API_URL` | Railway public URL, napr. `https://….up.railway.app` (**bez** `/` na konci) |
| `DOCWRIGHT_API_KEY` | rovnaký string ako na Railway |

> Automatický `secrets.GITHUB_TOKEN` v workflow **nepridávaj** — GitHub ho dáva sám (na PR komentár).

### 3.3 Variables (Repository variables)

| Name | Value |
|------|--------|
| `VITE_API_URL` | tá istá Railway public URL |

Používa ju workflow **Deploy Pages** pri builde frontendu.

### 3.4 GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source** = **GitHub Actions**
3. Spusti deploy:
   - push na `main`, alebo
   - **Actions** → workflow **Deploy Pages** → **Run workflow**
4. Frontend URL: `https://<user>.github.io/<repo>/`  
   (napr. `https://JaGajdos.github.io/docwright/`)

### 3.5 CORS na Railway po Pages

Na Railway uprav:

```text
CORS_ORIGINS=https://JaGajdos.github.io
```

(nahraď svojím username; origin **bez** cesty `/docwright`)

Deploy staged changes.

### 3.6 PR Action (sticky komentár)

Workflow: [`.github/workflows/docwright-pr.yml`](../.github/workflows/docwright-pr.yml)

- Trigger: `opened` / `reopened` / `synchronize`
- Potrebuje secrets z §3.2
- Permissions: `contents: read`, `pull-requests: write`

---

## 4. Lokálny vývoj

```bash
cp .env.example .env
# doplň OPENAI_API_KEY / Azure + GITHUB_TOKEN
npm ci
npm test
npm run dev:api    # :8787
npm run dev:web    # :5173  (VITE_API_URL default = http://localhost:8787)
npm run generate -- owner/repo
```

Lokálne MCP: Docker (`docker run … github-mcp-server`) **alebo** binárka +  
`DOCWRIGHT_MCP_COMMAND` / `DOCWRIGHT_MCP_ARGS='["stdio"]'`.

---

## 5. Čo kam (prehľad — nikdy do gitu)

| Secret / config | Railway | GitHub Actions | Pages bundle | Commit |
|-----------------|---------|----------------|--------------|--------|
| Azure / OpenAI key | ✅ | ❌ | ❌ | ❌ |
| `AZURE_OPENAI_*` | ✅ | ❌ | ❌ | ❌ |
| GitHub PAT (MCP) | ✅ `GITHUB_TOKEN` | ❌ | ❌ | ❌ |
| `DOCWRIGHT_API_KEY` | ✅ | ✅ secret | ❌ | ❌ |
| `DOCWRIGHT_API_URL` | — | ✅ secret | ❌ | ❌ |
| `VITE_API_URL` | — | ✅ **variable** | len URL API | ❌ |
| `CORS_ORIGINS` | ✅ | — | — | ❌ |
| `GITHUB_TOOLSETS` / `GITHUB_TOOLS` | ✅ | — | — | ❌ |

---

## 6. Riešenie častých chýb

| Symptóm | Príčina | Riešenie |
|---------|---------|----------|
| `401 Incorrect API key` + odkaz na platform.openai.com | Chýba Azure endpoint → ide na public OpenAI | Nastav `AZURE_OPENAI_ENDPOINT` (+ version, deployment), Deploy |
| `MCP error … Connection closed` | MCP binárka / `stdio` / token | Skontroluj `GITHUB_TOKEN`, `DOCWRIGHT_MCP_*`; redeploy |
| `unknown tool "get_repository_tree"` | Toolset `git` nie je zapnutý | `GITHUB_TOOLSETS=repos,git` + `GITHUB_TOOLS=get_repository_tree,get_file_contents` |
| `AGENT_LIMIT` / bez finálneho README | Model donekonečna volá tools | Opravené vo force-final agent loop; pull latest `main` a redeploy |
| Build: `apps/web/package.json not found` | `.dockerignore` vylúčil web | Opravené v repo; pull latest `main` |
| Len `*.railway.internal` | Nie je public domain | Generate Domain, port 8080 |
| CORS v browsri | `CORS_ORIGINS` ≠ Pages origin | Nastav `https://<user>.github.io` |
| Variables „nefungujú“ po pridaní | Staged changes bez Deploy | Canvas banner → **Deploy** |
| Action spam komentárov | — | Sticky marker `<!-- docwright-bot -->` (create/update) |

---

## 7. Acceptance (prvý beh)

- [ ] `GET /` na Railway → `docwright-api` JSON
- [ ] `POST /v1/generate` s `{"repo":"sindresorhus/is"}` → README + Mermaid (alebo fallback)
- [ ] Pages URL bez loginu → Generate → mapa + README
- [ ] Test PR → jeden sticky Docwright komentár; druhý push = **update** toho istého

---

## 8. Súvisiace súbory v repo

| Súbor | Účel |
|-------|------|
| [`Dockerfile`](../Dockerfile) | Railway image (API + MCP binárka) |
| [`railway.toml`](../railway.toml) | Docker builder |
| [`.env.example`](../.env.example) | šablóna env |
| [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) | GitHub Pages |
| [`.github/workflows/docwright-pr.yml`](../.github/workflows/docwright-pr.yml) | sticky PR Action |
| [`action/`](../action/) | Action entrypoint |

**Stav:** prevádzková inštalačná príručka (hackathon / MVP).
