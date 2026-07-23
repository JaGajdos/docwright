# Prevádzka MVP: stack, limity, chyby, Action, MCP, testy

Špecifikácia zvyšku potrebná na **jednoduché, reálne použiteľné** MVP.  
Nadväzuje na `04`–`09`. Zadanie: [`../zadanie.txt`](../zadanie.txt).

---

## 1. Tech stack + štruktúra repo (jednoduché)

### Stack

| Vrstva | Voľba | Prečo |
|--------|--------|------|
| Jazyk | **TypeScript** | Jeden jazyk pre web + API + shared |
| Runtime | **Node.js 20+** | Railway + Actions |
| Frontend | **Vite + plain TypeScript** | Statický build → GitHub Pages |
| Backend | **Hono** (jeden HTTP server) | `POST /v1/generate` |
| Shared | `packages/core` — agent + LLM/MCP providers + template + limity | Action volá API; core beží na Railway |
| Ingest | **MCP provider** (default GitHub stdio) + agent | Railway |
| LLM | **Pluggable** (`openai` / `azure` / `openai-compatible`) — §2 | |
| Testy | **Vitest** | Rýchle unit/integration |


Žiadny monorepo orchestrátor navyše (Turborepo/Nx) — **npm workspaces** ([`11`](./11-implementacne-rozhodnutia.md)).

### Štruktúra repo

```text
/
  doc/
  config/              # agent.json + prompts/*.md
  packages/
    core/              # agent + LLM/MCP providers + template
  apps/
    api/               # HTTP + štart MCP → Railway
    web/               # Vite (plain TS) → GitHub Pages
  action/              # volá Railway API + sticky comment
  templates/
    readme.md
  .github/workflows/
    deploy-pages.yml
    docwright-pr.yml
  …
```

**Pravidlo:** web ani Action nevolajú LLM/MCP priamo — len Railway API.

---

## 2. LLM — pluggable provider (default GPT)

| Položka | Hodnota |
|---------|---------|
| Factory | `createLlmProvider()` — env `DOCWRIGHT_LLM_PROVIDER` |
| Default | `openai` — public OpenAI, alebo **Azure** ak je `AZURE_OPENAI_ENDPOINT` |
| Ďalšie | `azure` (vynútiť), `openai-compatible` (`OPENAI_BASE_URL`) |
| Public model | `OPENAI_MODEL` default `gpt-4o-mini` |
| Azure | `AZURE_OPENAI_*` + Responses API (`DOCWRIGHT_LLM_API`) |
| Secret | `OPENAI_API_KEY` (+ Azure vars) len na **Railway** (nie v Action) |

Detail: [`packages/core/src/llm/README.md`](../packages/core/src/llm/README.md).  
Správanie podľa [`05`](./05-readme-a-architecture-map.md): agent loop + Mermaid repair.  
Ingest: MCP provider na Railway ([`04`](./04-ziskanie-obsahu-github.md)).

### Limit na LLM (povinné — nie plná prevádzka)

Bez loginu musí existovať **tvrdé obmedzenie nákladov**:

| Limit | Default | Kde |
|-------|---------|-----|
| Rate limit per IP | **5 generate / hodinu** | API (web) |
| Rate limit per IP (denný) | **20 generate / deň** | API |
| Max súborov / bytes | podľa [`04`](./04-ziskanie-obsahu-github.md) | core |
| Max timeout requestu | **120 s** | API |
| OpenAI max tokens (output) | konfig, napr. **4096** | core |

Pri prekročení → HTTP `429` + zrozumiteľná správa vo webe.  
Action: volá Railway s `DOCWRIGHT_API_KEY`; limity ingest z `04` platia na serveri.

---

## 3. Abuse / rate limit (verejné bez loginu)

```
Browser → API
  1. Parse IP (X-Forwarded-For / Railway)
  2. Check rate limit store (in-memory OK pre MVP; alebo Railway Redis neskôr)
  3. Ak OK → generate; inak 429
```

- Žiadny login.
- Žiadny API key v UI.
- Voliteľne: jednoduchý honeypot / reject zjavne bot User-Agent — nie povinné.
- Externé volanie API s `Authorization: Bearer` (z `06`) môže mať **vyšší** limit; web (bez key) = prísnejší.

---

## 4. Chyby a UX stavy (základ)

### API → HTTP

| Situácia | HTTP | `error.code` (príklad) |
|----------|------|-------------------------|
| Neplatná URL / repo formát | 400 | `INVALID_REPO` |
| Repo neexistuje / private | 404 | `REPO_INACCESSIBLE` |
| Rate limit | 429 | `RATE_LIMITED` |
| OpenAI / upstream fail | 502 | `LLM_UNAVAILABLE` |
| Timeout | 504 | `TIMEOUT` |
| OK | 200 | — |

Response chyby: `{ "error": { "code": "…", "message": "…" } }` (ľudská `message` pre UI).

### Web UI stavy

| Stav | Čo user vidí |
|------|----------------|
| Idle | Pole + Generate |
| Loading | Spinner / „Generating docs…“ (disable button) |
| Success | Mapa + README |
| `INVALID_REPO` | „Skontroluj adresu repa (public GitHub).“ |
| `REPO_INACCESSIBLE` | „Repo sa nenašlo alebo nie je public.“ |
| `RATE_LIMITED` | „Príliš veľa požiadaviek. Skús neskôr.“ |
| `TIMEOUT` / `LLM_UNAVAILABLE` | „Dočasný problém. Skús znova.“ |

Disclaimer vždy viditeľný (pätka) — §10.

Health/readiness endpoint: **nerobíme** (podľa rozhodnutia).

---

## 5. Ako nainštalovať GitHub Action (štandardne)

Detail + Railway/Pages setup: [`09-nasadenie.md`](./09-nasadenie.md).

1. V cieľovom repo: `.github/workflows/docwright.yml` (example z Docwright).
2. Secrets: **`DOCWRIGHT_API_URL`**, **`DOCWRIGHT_API_KEY`** (nie OpenAI v klientskom repo).
3. Permissions: `contents: read`, `pull-requests: write`.
4. PR → Action volá Railway (Agent+MCP) → sticky komentár.

```yaml
name: Docwright
on:
  pull_request:
    types: [opened, reopened, synchronize]
permissions:
  contents: read
  pull-requests: write
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: <owner>/<docwright-repo>/action@main
        with:
          api-url: ${{ secrets.DOCWRIGHT_API_URL }}
          api-key: ${{ secrets.DOCWRIGHT_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 6. Agent + MCP — kde beží (uzavreté)

| Miesto | Úloha |
|--------|--------|
| **API host** (default **Railway**) | MCP provider + AI agent + LLM — každý generate z webu/API/Action |
| GitHub Pages | Len UI |
| Action runner | Len HTTP klient + PR komentár |
| Cursor (optional) | Lokálny vývoj / demo s MCP — nie náhrada API hostu |

Railway je **default MVP hosting**, nie väzba v kóde — výmena hostu: [`09` §2.7](./09-nasadenie.md#27-iný-backend-host-nie-railway).  
Zadanie „Connect the GitHub MCP…“ = implementované **na API hoste** (Agent+MCP), nie len v dokumentácii.

---

## 7. Test plán (základ zo spec)

Framework: **Vitest**. Cieľ: *Tests From The Spec* — nie full E2E všetkého.

### `packages/core`

| Test | Zo spec |
|------|---------|
| Parse `owner/repo` a GitHub URL | `04` / `08` |
| Agent volá MCP tools v poradí tree → files (mock MCP) | `04` |
| Limity `maxFilesRead` / truncate | `04` / `config/agent.json` |
| Template: všetky default placeholdery sa dajú vyplniť | `05` |
| Mermaid retry → fallback text ak nevalidné | `05` |
| Merge faktov: mock starý README → nový výstup obsahuje kľúčový fakt | `05` |

### `apps/api`

| Test | Zo spec |
|------|---------|
| `400` neplatný repo | `10` §4 |
| `429` po prekročení rate limitu (mock store) | `10` §3 |
| `200` shape JSON (`readmeMarkdown`, `architectureMermaid`, …) | `06` |

### `apps/web` (ľahké)

| Test | Zo spec |
|------|---------|
| Render error message pre známe `error.code` | `10` §4 |
| Generate button disabled počas loading | `08` |

### Action

| Test | Zo spec |
|------|---------|
| Sticky marker `<!-- docwright-bot -->` v comment body builderi | `06` |
| Summary README ≠ full (skrátenie) | `06` |

E2E proti live OpenAI / live GitHub: **nie** v CI default (náklady); manuálne / optional.

---

## 8. Prevádzka

Plný runbook **teraz neriešime**.  
Povinné ostáva: **LLM + rate limity** (§2–§3) a secrets na Railway / Action.

---

## 9. Právny disclaimer (jednoduchý)

Zobraziť vo webe (pätka) a v PR komentári (krátky riadok):

> Docwright uses AI to draft documentation from public repository content. Output may be incomplete or incorrect — always review before use. Only public GitHub repositories are supported. By using this service you agree not to abuse the service (rate limits apply).

SK variant (ak `output_language=sk` / UI SK):

> Docwright používa AI na návrh dokumentácie z obsahu public GitHub repozitárov. Výstup môže byť neúplný alebo nesprávny — pred použitím skontrolujte. Podporované sú len public repá. Rate limity platia.

Žiadny právnik / ToS dokument v MVP — stačí tento text.

---

## 10. Acceptance (tento dokument)

- [ ] Repo štruktúra podľa §1
- [ ] LLM provider (`openai` default / Azure / compatible) + limity tokenov/timeout
- [ ] Rate limit na verejnom API (IP)
- [ ] Web + API error stavy podľa §4
- [ ] Example workflow na inštaláciu Action (§5)
- [ ] README / docs: Railway = Agent+MCP; Action volá API (§5–§6)
- [ ] Vitest pokrytie podľa §7
- [ ] Disclaimer vo webe (+ krátko v PR komentári)

**Health API:** mimo scope.  
**Custom prevádzka / on-call:** mimo scope.

---

## 11. Rozhodnutia (uzavreté)

| # | Rozhodnutie |
|---|-------------|
| 1 | Stack: **TS + Vite (plain TS) web + Hono API + packages/core + MCP na Railway** |
| 2 | LLM: **pluggable** (`openai` / `azure` / `openai-compatible`); default GPT / Azure podľa env |
| 3 | Rate limit: áno (IP), bez loginu |
| 4 | Chyby/UX: tabuľka §4 |
| 5 | Health endpoint: **nie** |
| 6 | Action: workflow + `DOCWRIGHT_API_URL` / `DOCWRIGHT_API_KEY` |
| 7 | **Agent + MCP beží na API hoste** (default Railway; portabilné — `09` §2.7) |
| 8 | MCP: **provider registry** (default `github`); výber podľa URL hostu |
| 9 | Testy: Vitest, základné zo spec |
| 10 | Prevádzka: nie; LLM limity áno |
| 11 | Disclaimer: krátky text §9 |
