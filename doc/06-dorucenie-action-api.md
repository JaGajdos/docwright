# Doručenie: GitHub Action + Public API

Špecifikácia podľa [`../zadanie.txt`](../zadanie.txt).  
Nadväzuje na [`04`](./04-ziskanie-obsahu-github.md) (Agent+MCP) + [`05`](./05-readme-a-architecture-map.md).

> **Quick start:** *… ship it as a GitHub Action that comments on new PRs.*  
> **REACH FOR:** GitHub Actions · Public API

---

## 1. Čo zadanie vyžaduje

| Bod | Význam |
|-----|--------|
| Public API | `POST /v1/generate` na **Railway** = Agent + MCP + OpenAI |
| Web app | Klient API — URL → README + mapa ([`08`](./08-web-app.md)) |
| GitHub Action | Sticky PR komentár; generate cez **volanie Railway API** |

**Non-goals:** auto-commit do default branch; docs site; private repo; Actions artifact.

---

## 2. Tok (uzavreté)

```
  Web (Pages) ──► Railway API ──► Agent + GitHub MCP + OpenAI ──► JSON
                                      ▲
  GH Action ──────────────────────────┘
       │  POST /v1/generate (repo = PR head)
       └──► sticky PR comment (mapa full + skrátený README)
```

**Jeden mozog:** Agent+MCP beží **len na Railway**. Action a Web ho len volajú.

---

## 3. Public API (Railway)

### 3.1 Kontrakt

```http
POST /v1/generate
Content-Type: application/json
# Web (browser): bez Authorization — rate limit podľa IP
# Action / integrácie: Authorization: Bearer <DOCWRIGHT_API_KEY>

{
  "repo": "owner/name",
  "ref": "main",
  "language": "en",
  "limits": { }
}
```

**Sync**, timeout ~60–120 s.

**Response `200`:** `readmeMarkdown`, `architectureMermaid`, `architectureMarkdownFile`, `warnings`, `prCommentMarkdown`, …

Chyby: `400` · `401` (ak vyžadovaný key a chýba) · `404` · `429` · `502` · `504`.

### 3.2 Auth

| Volajúci | Auth |
|----------|------|
| Web (end-user) | Bez loginu, bez key v UI; **rate limit IP** |
| Action / skripty | `DOCWRIGHT_API_KEY` (Bearer) |

---

## 4. GitHub Action

### 4.1 Trigger

```yaml
on:
  pull_request:
    types: [opened, reopened, synchronize]
```

### 4.2 Správanie

1. Zistiť `owner`, `repo`, PR number, head ref/SHA.
2. `POST` na Railway `/v1/generate` s `repo` + `ref` = PR head (Agent+MCP na serveri).
3. Z odpovede zložiť sticky komentár: **full mapa** + **skrátený README**.
4. Nájdi komentár s `<!-- docwright-bot -->` → update; inak create.
5. **Nekommitovať** súbory.

### 4.3 Permissions

```yaml
permissions:
  contents: read
  pull-requests: write
```

### 4.4 Secrets / inputs (v repozitári kde Action beží)

| Secret / input | Účel |
|----------------|------|
| `DOCWRIGHT_API_URL` | Base URL Railway (`https://….up.railway.app`) |
| `DOCWRIGHT_API_KEY` | Bearer pre server→server volanie |
| `GITHUB_TOKEN` | Default — sticky komentár |

*(OpenAI a GitHub MCP tokeny sú na Railway — nie v každom klientskom repo.)*

### 4.5 Príklad workflow

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

---
_AI-generated draft — review before use. Docwright · jump to exploration_
```

---

## 6. Acceptance

- [ ] Railway `/v1/generate` = **Agent + GitHub MCP** (povinné)
- [ ] Web volá Railway; bez loginu; rate limit
- [ ] Action volá Railway + sticky komentár
- [ ] Komentár: full mapa + skrátený README; bez auto-commit
- [ ] Žiadny Actions artifact pre architecture súbor

---

## 7. Rozhodnutia (uzavreté)

| # | Rozhodnutie |
|---|-------------|
| 1 | Trigger: `opened` + `reopened` + `synchronize` |
| 2 | Sticky komentár |
| 3 | Generate: **vždy na Railway (Agent+MCP)**; Action = klient API |
| 4 | README v PR skrátený; full v API |
| 5 | API sync |
| 6 | Web bez key; Action/integrácie s API key |
| 7 | Architecture súbor len v API response |
| 8 | Ingest web/API/Action generate path: **MCP na Railway** |
