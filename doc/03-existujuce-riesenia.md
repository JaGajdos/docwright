# Existujúce riešenia a postupy

> Stav: prieskum doplnený (júl 2026). Zameranie: **reálne fungujúce** produkty / OSS, ktoré vieme overiť (repo, Marketplace, docs).

Cieľ: zistiť, čo už trh robí, čo z toho **skopírovať ako pattern**, a kde má Docwright **diferenciátor**.

---

## Zhrnutie pre Docwright

| Čo potrebujeme (MVP) | Najlepší vzor na trhu | Čo zobrať | Čo nerobiť |
|----------------------|------------------------|-----------|------------|
| Vstup: public GitHub repo | Mintlify URL rewrite; ReadmeAI `--repository URL` | „Ukáž URL → dostaneš docs“ UX | Budovať full docs site (Mintlify territory) |
| File tree + smart sampling | Swark, ReadmeAI, Mintlify agent | Context budget; entry points / exports; exclude `node_modules` | Posielať celý repo do LLM |
| README z template | ReadmeAI, Always-Readme | Fixná štruktúra sekcií + badges + tree | Free-form román bez template |
| Architecture mapa (1 screen) | Swark, CodeRabbit walkthrough | **Mermaid** v Markdown (GitHub to renderuje) | Ťažké C4 multi-level docs (CodeArchDoc) |
| Action komentár na PR | CodeRabbit walkthrough; AI PR Reviewer Actions | Jeden sticky komentár, update namiesto spam | Auto-commit na `main` bez review |
| GitHub MCP | [github/github-mcp-server](https://github.com/github/github-mcp-server) (~31k★) | Oficiálny MCP: tree, files, PRs, comments | Vlastný thin wrapper okolo REST, ak MCP stačí |
| L2 Quality / L3 Security | OpenSSF Scorecard, Dependabot, CodeQL | Hotové scannery → scorecard v reporte | Čisto LLM „security review“ bez tools |

**Diferenciátor Docwright vs. klony:** nie docs platforma (Mintlify) ani PR code-review (CodeRabbit), ale **onboarding balík** (README + one-screen arch mapa) s **Action + API**, ideálne ako „jump to exploration“.

---

## A. Dokumentácia / onboarding (MVP)

### 1. Mintlify — auto-generate docs from GitHub

| | |
|--|--|
| **Čo je** | Docs platforma. Live flow: v URL nahradiť `github.com` → `mintlify.com` na public repo → AI vygeneruje celý docs site. |
| **Funguje?** | Áno — produktový feature (blog Mar 2026): agent scrapuje README + metadata, brand assets, potom paralelne píše sekcie v sandboxoch (Daytona + Claude). |
| **Odkaz** | https://www.mintlify.com/blog/auto-generate-docs-from-repos |

**Zobrať:**
- UX „repo URL → docs“ (minimálny friction).
- Pipeline: metadata/README → **najprv štruktúra (outline)** → potom content.
- Brand heuristics z GitHub pages / README (pre Docwright skôr voliteľné).
- Validácia výstupu (u nich Mintlify CLI / broken links) — u nás aspoň: Mermaid syntax check, povinné README sekcie.

**Nerobiť:**
- Full docs site, hosting, navigácia, OpenAPI sync — mimo MVP scope.

---

### 2. ReadmeAI (`eli64s/readme-ai`) — ~2.9k★, PyPI `readmeai`

| | |
|--|--|
| **Čo je** | CLI: URL alebo lokálna cesta → štruktúrovaný README (LLM + preprocessing). Multi-provider (OpenAI, Anthropic, Gemini, Ollama), offline boilerplate mód. |
| **Funguje?** | Áno — aktívny OSS (push 2026), PyPI, docs site. |
| **Odkaz** | https://github.com/eli64s/readme-ai · https://pypi.org/project/readmeai/ |

**Zobrať:**
- Vstup `owner/repo` alebo URL bez manuálneho clonu (v UI/API).
- Template-driven výstup: header, badges, tree, overview, … (nie čistý free-form).
- `tree-depth` / sampling — kontrola veľkosti kontextu.
- Offline / metadata-first fallback (aspoň čiastočný README aj bez LLM).

**Nerobiť:**
- Súťažiť o „najkrajší README“ s emoji/logo themes — Docwright má byť onboarding-first, nie cosmetics.

---

### 3. Always-Readme (GitHub Marketplace Action)

| | |
|--|--|
| **Čo je** | Action: na push vezme diff + aktuálny README → LLM → commit na `readme-update` branch + otvorí PR (nikdy nemerguje sama). |
| **Funguje?** | Áno — v Marketplace (`busycaesar/always-readme@v0.1.1`), jasný workflow. |
| **Odkaz** | https://github.com/marketplace/actions/always-readme |

**Zobrať:**
- **Nikdy auto-merge** docs — PR / komentár na review (sedí s našim non-goal).
- Diff-aware update (nehádzať celý repo pri každom run).
- Skip, ak sa nič nezmenilo (`updated: false`).

**Nerobiť / upraviť pre Docwright:**
- Zadanie chce **komentár na nový PR**, nie nutne commit README branch — Always-Readme je iný delivery model. Pattern „update existing comment“ je bližší CodeRabbit / AI PR Reviewer.

---

### 4. Ďalšie README Actions (orientačne)

| Nástroj | Poznámka |
|---------|----------|
| [surfruit/readme-ai](https://github.com/surfruit/readme-ai) / podobné CLI | Analyze remote URL + Action na regenerate README on push |
| [bitflight-devops/github-action-readme-generator](https://github.com/marketplace/actions/github-action-s-readme-generator) | Sync `action.yml` → README (úzky use-case, nie AI) |
| Groq-based “Auto-Readme-Generator” workflows | Fungujú, ale skôr personal scripts — slabší product pattern |

---

### 5. Architecture map generátory

#### Swark (`swark-io/swark`) — ~1.7k★, VS Code Marketplace

| | |
|--|--|
| **Čo je** | Extension: vyberie folder → file retrieval podľa token limitu → prompt → Mermaid diagram (cez GitHub Copilot / LM API). |
| **Funguje?** | Áno — Marketplace + OSS. |
| **Odkaz** | https://github.com/swark-io/swark · https://marketplace.visualstudio.com/items?itemName=swark.swark |

**Zobrať (kľúčové pre „one-screen“ mapu):**
1. File retrieval s **max files / token budget**.
2. Prompt: „architecture diagram from these files“.
3. Výstup **Mermaid v Markdown** (render na GitHub PR/README).
4. Voliteľne `fixMermaidCycles` — LLM často generuje nevalidný Mermaid.

**Nerobiť:** viazať sa na Copilot/VS Code — Docwright beží agent + Action + API.

#### CodeArchDoc / oh-my-mermaid / DiageniX

| Nástroj | Čo | Pre Docwright |
|---------|-----|---------------|
| [CodeArchDoc](https://github.com/GabrielEliasMarcelo/CodeArchDoc/) | C4 (4 úrovne), PlantUML, Draw.io | Overkill pre MVP; inšpirácia len ak pôjdeme hlbšie |
| [oh-my-mermaid](https://ohmymermaid.com/) | Nested Mermaid perspectives + Claude skills | Dobré UX drill-down; MVP má byť **jeden** screen |
| DiageniX (VS Code) | Gemini → Mermaid typy diagramov | Rovnaký Mermaid pattern, IDE-bound |

**Odporúčanie MVP:** jedna Mermaid `flowchart` / `C4Context`-light mapa + krátky legend text; nie multi-level docs tree.

---

### 6. CodeRabbit — PR walkthrough (clone zo zadania)

| | |
|--|--|
| **Čo je** | AI code review App. Každý PR dostane **walkthrough komentár**: summary, changed files, často **sequence diagram**, effort, labels. |
| **Funguje?** | Áno — produkčný SaaS, docs: https://docs.coderabbit.ai/pr-reviews/walkthroughs |
| **Konfig** | `.coderabbit.yaml` — zapínať/vypínať sekcie walkthrough |

**Zobrať:**
- Jeden **štruktúrovaný sticky komentár** na vrchu PR (nie 50 inline notes).
- Sekcie zapínateľné (README draft / arch mapa / neskôr quality).
- Placeholder → update toho istého komentára (žiadny spam pri `synchronize`).
- Mermaid / sequence diagram v PR komentári (GitHub to zvláda).

**Nerobiť:**
- Full line-by-line code review — to je CodeRabbit product, nie Docwright.

---

### 7. Ľahké AI PR Actions (pattern komentára)

Príklad: [AI PR Reviewer by Bonn](https://github.com/marketplace/actions/ai-pr-reviewer-by-bonn) — `pull_request` → LLM → **jeden PR komentár**, pri nových commitoch **update existujúceho**.

**Zobrať pre Docwright Action:**
```text
on: pull_request (opened, synchronize, reopened)
permissions: contents: read, pull-requests: write
→ generate README + arch map
→ create or update comment (nie nový komentár každý sync)
```

---

## B. Building blocks zo zadania (REACH FOR)

### GitHub MCP — oficiálny server

| | |
|--|--|
| **Repo** | https://github.com/github/github-mcp-server (~31k★, MIT, aktívny) |
| **Remote** | `https://api.githubcopilot.com/mcp/` |
| **Local** | Docker `ghcr.io/github/github-mcp-server` + PAT |

**Relevantné tooly pre Docwright:** `get_file_contents`, tree/list contents, search code, PR metadata, `add_issue_comment` / review comments.

**Zobrať:** MCP ako primárny prístup k public repo v agent flow (presne podľa zadania). Pre Action v CI môže byť praktickejší priamy GitHub API / `actions/checkout` + lokálny analyze — MCP vs. REST rozhodnúť podľa runtime (agent IDE vs. CI).

---

## C. Kvalita projektu (nice to have / L2)

| Nástroj | Čo dáva | Ako použiť v Docwright |
|---------|---------|-------------------------|
| CI / Actions status | Zelený/červený signal | Sekcia „CI“ v scorecard |
| Test / coverage badges | Existencia testov | Checklist: má testy? má coverage report? |
| SonarQube / CodeClimate | Complexity, smells | Skôr link-out než reimplementácia |
| Docs checklist | README sekcie, LICENSE, CONTRIBUTING | Heuristiky + LLM gap analysis |

**Pattern:** deterministic checks + krátky LLM commentary, nie čistý LLM score.

---

## D. Bezpečnosť (nice to have / L3)

### OpenSSF Scorecard — ~5.6k★

| | |
|--|--|
| **Čo je** | Automatické security-health checks na repo (branch protection, dangerous workflows, SAST, …). Action + CLI + API. |
| **Odkaz** | https://github.com/ossf/scorecard · https://scorecard.dev |

**Zobrať:**
- Volanie Scorecard (alebo zhrnutie checks) do Docwright security summary.
- Badge / score ako dôveryhodný signal (nie vymyslené LLM skóre).

### Ďalšie hotové vrstvy

| Nástroj | Úloha |
|---------|--------|
| Dependabot / OSV / Snyk | Dependencies + CVE |
| CodeQL / Semgrep | SAST |
| GitHub secret scanning | Secrets v histórii |
| Branch protection / Actions `permissions:` | Repo hygiene |

**Odporúčanie:** L3 = **agregátor existujúcich signálov** + LLM len na vysvetlenie; nie vlastný security scanner.

---

## E. Čo konkrétne skopírovať do MVP návrhu

Odporúčaný pipeline (zložený z overených patternov):

```
1. Vstup: public repo URL
2. Načítanie: GitHub MCP (alebo checkout v Action)
   - file tree + README + package manifests + entry points
3. Sampling: max N súborov / token budget (Swark / ReadmeAI pattern)
4. Outline: fixný template sekcií README
5. Generate: README.md + Mermaid architecture (one screen)
6. Validate: povinné sekcie + Mermaid parse
7. Deliver:
   - GitHub Action → sticky PR comment (CodeRabbit / Bonn pattern)
   - Public API → JSON { readme, architecture_mermaid, meta }
```

### README template (minimálny — inšpirovaný ReadmeAI / onboarding best practice)

1. Názov + 1–2 vety „čo to je“
2. Quick start
3. Architecture (Mermaid)
4. Štruktúra repo (strom)
5. Kľúčové príkazy / scripts
6. Konfigurácia / env (ak nájde)
7. Licencia (z GitHub metadata)

---

## F. Konkurenčná mapa (1 pohľad)

```
                    docs site / hosting
                           ▲
                     Mintlify
                           │
    README-only ◄──────────┼──────────► full PR review
    ReadmeAI               │              CodeRabbit
    Always-Readme          │
                           │
                      ★ Docwright ★
                   README + 1-screen arch
                   + Action comment + API
                           │
                    jump to exploration
```

---

## G. Otvorené follow-upy z prieskumu

- [ ] Overiť Mintlify URL rewrite na 1–2 známych public repo (smoke test UX)
- [ ] Spustiť ReadmeAI alebo Swark na demo repo — porovnať kvalitu Mermaid / README
- [ ] Rozhodnúť: Action robí full generate vs. volá Docwright API
- [ ] Rozhodnúť MCP v CI (áno/nie) vs. len v agent / local path
