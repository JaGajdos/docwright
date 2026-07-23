# Doručenie: GitHub Action + Public API

Špecifikácia podľa [`../zadanie.txt`](../zadanie.txt) — **bez rozšírenia scope**.  
SDD: nadväzuje na [`04`](./04-ziskanie-obsahu-github.md) (ingest) + [`05`](./05-readme-a-architecture-map.md) (generate).

> **Quick start:** *… Then ship it as a GitHub Action that comments on new PRs.*  
> **REACH FOR:** GitHub Actions · Public API

---

## 1. Čo zadanie vyžaduje

| Bod | Význam |
|-----|--------|
| GitHub Action | Workflow v CI |
| Comments on PRs | Výstup = **sticky PR komentár** (Markdown) |
| Public API | Programový `POST /v1/generate` → README + mapa |

**Non-goals:** auto-commit / merge docs do default branch; docs site; private repo; Actions artifact pre architecture súbor.

---

## 2. Scope

### In scope
- GitHub Action: generate **v jobe** + **sticky** komentár na PR
- Public API: sync endpoint + **API key** auth
- Shared Docwright core (knižnica) použitá Action jobom aj API
- Konfigurácia: Action inputs / secrets / API body (limity, template, jazyk z `04`/`05`)

### Out of scope
- Auto-merge do `main`
- Action → volanie hostovaného API ako jediná cesta generate (zvolené: generate v jobe)
- Actions artifact pre `ARCHITECTURE.md`
- Web UI

---

## 3. Tok doručenia (uzavreté)

```
  Public API ──► Docwright core (shared) ──► JSON (full README + mapa + architectureMarkdownFile)
                      ▲
  GH Action ──────────┘
       │  checkout / REST ingest + generate v jobe
       └──► sticky PR comment (mapa full + skrátený README)
```

**Agent / local quick start** (zo zadania): GitHub **MCP** + agent — pozri [`04`](./04-ziskanie-obsahu-github.md).  
**Action / API server:** ingest cez **checkout alebo GitHub REST** (ekvivalent tree/files); MCP nie je povinný v CI/serveri.

---

## 4. GitHub Action

### 4.1 Trigger (uzavreté)

```yaml
on:
  pull_request:
    types: [opened, reopened, synchronize]
```

- `synchronize` = aj pri nových commitov do PR (aktualizácia sticky komentára).
- Sticky update bráni spamu pri opakovaných runoch.

### 4.2 Správanie

1. Context: `owner`, `repo`, PR number, head SHA.
2. `actions/checkout` (PR head) + Docwright generate **v jobe** (shared core).
3. Zostaviť PR komentár (§5): **full architecture map** + **skrátený README**.
4. **Sticky komentár:** nájsť existujúci Docwright komentár (marker) → `update`; inak `create`.
5. **Nekommitovať** súbory do vetvy.
6. Plný README / `architectureMarkdownFile` **nie** ako Actions artifact — len cez Public API.

### 4.3 Permissions

```yaml
permissions:
  contents: read
  pull-requests: write
```

### 4.4 Inputs / secrets

| Input / secret | Účel |
|----------------|------|
| LLM API key | Generate |
| `readme_template_path` | Custom šablóna (optional) |
| `output_language` | `en` \| `sk` |
| limity z `04`/`05` | optional overrides |
| GitHub token | default `GITHUB_TOKEN` na komentár |

*(Docwright API URL nie je potrebná pre generate v jobe.)*

### 4.5 Ingest v Action (podľa zadania)

| Path | Ingest |
|------|--------|
| Agent (quick start) | **GitHub MCP** — povinné zo zadania |
| Action job | **Checkout + FS** (alebo REST) — rovnaký výstupný kontrakt ako `04`, bez povinného MCP v CI |

---

## 5. Formát sticky PR komentára

```markdown
<!-- docwright-bot -->
## Docwright — onboarding docs

_Generated for this PR (`{{sha_short}}`)._

### Architecture
```mermaid
{{architecture}}
```

### README (summary)
{{readme_summary}}

<details>
<summary>Full README available via Public API</summary>

Use `POST /v1/generate` for the complete README draft.

</details>

---
_Docwright · jump to exploration_
```

| Časť | V komentári | V API |
|------|-------------|-------|
| Architecture map | **Full** (Mermaid / fallback) | Full |
| README | **Skrátený** (napr. title, one-liner, What it is, Quick start) | **Full** `readmeMarkdown` |
| `architectureMarkdownFile` | Nie (nie artifact) | Áno v JSON |

Marker `<!-- docwright-bot -->` = identifikácia pre sticky update.

---

## 6. Public API

### 6.1 Kontrakt

```http
POST /v1/generate
Authorization: Bearer <DOCWRIGHT_API_KEY>
Content-Type: application/json

{
  "repo": "owner/name",
  "ref": "main",
  "language": "en",
  "limits": { }
}
```

**Sync:** client čaká na hotový výsledok (timeout orientačne 60–120 s).

**Response `200`:**

```json
{
  "repo": "owner/name",
  "ref": "main",
  "sha": "abc123…",
  "readmeMarkdown": "# …",
  "architectureMermaid": "flowchart TB\n…",
  "architectureMarkdownFile": "# Architecture\n\n```mermaid\n…\n```\n",
  "architectureFallbackText": null,
  "warnings": [],
  "prCommentMarkdown": "## Docwright…"
}
```

Chyby: `401` bad/missing API key · `400` · `404` · `429` · `502` · `504` timeout.

### 6.2 Auth (uzavreté)

- **API key** povinný (header). Žiadny hardcoded key v repo.
- Hosting: implementačný detail (nasadenie neskôr; body.txt Lower ceiling).

### 6.3 Ingest na API serveri (podľa zadania)

Zadanie: *Connect the GitHub MCP, have the agent read one repo’s file tree* = **agent path**.  
Public API = REACH FOR programový prístup — **nemusí** embedovať MCP.

→ API server: **GitHub REST** (tree + contents) alebo ekvivalent; shared core ako Action.  
MCP ostáva v agent / local quick start (`04`).

---

## 7. Väzba Action ↔ API (uzavreté)

**Model B — Generate v jobe** + samostatné Public API nad **shared core**.

| Kanál | Generate kde | Doručenie |
|-------|--------------|-----------|
| Action | V GitHub runneri | Sticky PR comment (skrátený) |
| Public API | Na serveri | Sync JSON (full) |

Action **nevolá** Public API na generate (nezávislé od API uptime v CI).

---

## 8. Riziká

| Riziko | Dopad | Mitigácia |
|--------|-------|-----------|
| Častý `synchronize` | LLM $ | Limity `04`; optional skip ak SHA už processed |
| Spam komentárov | Noise | **Sticky** update |
| Dlhý komentár | Nepehľadnosť | **Skrátený** README v PR |
| Secrets v Action | Únik | GitHub Secrets |
| Duplicita Action vs API | Drift logiky | Shared core knižnica |

---

## 9. Acceptance

- [ ] Action na `opened` / `reopened` / **`synchronize`** aktualizuje **sticky** PR komentár
- [ ] Komentár: **full mapa** + **skrátený README**; bez auto-commit
- [ ] Generate **v jobe** (shared core), nie povinné volanie API z Action
- [ ] Public API: sync `POST /v1/generate` + **API key** → full README + mapa + `architectureMarkdownFile`
- [ ] Žiadny Actions artifact pre architecture súbor
- [ ] Ingest: **MCP** v agent path; **REST/checkout** v Action/API
- [ ] Konzistentné s `04` + `05`

**Stav dokumentu:** doručenie — **uzavreté** pre SDD.

---

## 10. Rozhodnutia (uzavreté)

| # | Rozhodnutie |
|---|-------------|
| 1 | Trigger: **`opened` + `reopened` + `synchronize`** |
| 2 | Komentár: **sticky** update |
| 3 | Generate: **v jobe** (shared core; API samostatne) |
| 4 | README v PR: **skrátený**; full v API |
| 5 | API: **sync** |
| 6 | API auth: **API key** |
| 7 | Architecture súbor: **len v API response** (nie Actions artifact) |
| 8 | Ingest podľa zadania: **MCP = agent path**; Action/API = **REST/checkout** |
