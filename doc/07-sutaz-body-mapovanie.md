# Bodovanie súťaže vs. Docwright

Zdroj bodov: [`../body.txt`](../body.txt) · zadanie: [`../zadanie.txt`](../zadanie.txt).

Cieľ: maximalizovať body **bez scope drift** od zadania (FLAT *No Scope Drift* = 10 b.).

Legenda: ✅ sedí / v pláne zo zadania · 🟡 vieme doplniť bez driftu · 🔴 mimo zadania / risk drift · ⬜ ešte neurobené

---

## 1. GATE + FLAT (priorita — kvalifikácia a isté body)

| Bod | b. | Stav | Poznámka |
|-----|-----|------|----------|
| **Committed Spec Folder** | 15 | ⬜ takmer | `doc/` má scope + acceptance + tech spec — **treba commitnúť pred app kódom** |
| **Spec Before Code** | 10 | ⬜ | Rovnaký commit gate: žiadny app kód pred spec commitom |
| **No Scope Drift** | 10 | 🟡 | Držať sa `zadanie.txt` + uzavretých `doc/0x`; quality/security sme už vyhodili |
| **Tests From The Spec** | 8 | ⬜ | Po kóde: testy z acceptance v `04`/`05`/`06` |
| **Spec Updated After Feedback** | 8 | ⬜ | Až po peer feedbacku — upraviť `doc/`, nie len kód |
| First To Demo | 5 | ⬜ | Súťaž o čas |
| Mobile Responsive | 3 | 🟡 | Web app v `08` — základný responsive |
| Live Stripe Payment | 8 | 🔴 | Mimo zadania |

**Hneď:** dokončiť/uzavrieť `06` → **commit celého `doc/`** (GATE).

---

## 2. F FIRST TO USE (10 b. každý, bonus za prvenstvo)

### Už v zadaní / spec — **musíme / plánujeme**

| Tag | Stav | Ako v Docwright |
|-----|------|----------------|
| **Consumed An MCP** | ✅ | Oficiálny GitHub MCP na **Railway** pri každom generate (`04`/`09`) |
| **AI Agent** | ✅ | Tool-calling agent na Railway |
| **GitHub Actions** | ✅ | Action volá Railway + sticky komentár (`06`) |
| **Public API** | ✅ | Railway `POST /v1/generate` |
| **Used Deep Research** | 🟡 | `03` prieskum |
| **CLI-Driven CI/CD** | 🟡 | Pages deploy + PR workflow |

### Sedí k produktu, nízky drift — **odporúčané doplniť do spec/implementácie**

| Tag | Prečo OK | Ako |
|-----|----------|-----|
| **Built An MCP Server** | Docwright ako MCP tool (generate docs) — nie scope creep produktu, iný surface | Ten istý core; MCP server *expose* `generate` (popri HTTP API) |
| **Streaming** | Lepšie API/demo | Stream tokenov do response / jednoduchého UI ak bude |
| **Real Auth** | API key sme už navrhovali v `06` | Session/API key, nie hardcoded v kóde |
| **Webhooks** | Alternatíva/doplnok k Action | GitHub webhook `pull_request` → Docwright (edge) |
| **Cloud / Edge Workers** | Hosting API | Workers/edge pre `POST /v1/generate` |
| **Agent-Driven Testing** | SDD + Tests From Spec | Agent napíše/spustí testy z acceptance |
| **Custom Tooling** | Devex | Claude command/hook napr. `/docwright-spec` alebo generate |
| **Parallel Workstreams** | Proces | Git worktrees: napr. Action vs API paralelne |
| **Compaction Discipline** | Ingest limity | Prompt/process na context compaction (sedí k limitom `04`) |

### Slabý fit / nerobiť kvôli bodom (drift alebo ťažké)

| Tag | Dôvod |
|-----|--------|
| Built AI Trust | Netechnický teammate — personálne, nie tech scope |
| Cron / Scheduled Job | Nie v zadaní; Action na PR stačí |
| Vision | Nie v zadaní |
| Token-Making 100 b. | Herný/meta — neplánovať produkt okolo toho |
| Claude Ships It | Procesné; môže sa stať pri implementácii |

---

## 3. LOWER CEILING (6 b. / platforma)

Nasadenie Public API na jednu z: Cloudflare, Render, Vercel, Netlify, Railway, Fly.io, … (+ DB ak treba).

**Odporúčanie:** **GitHub Pages** + **Railway** (Agent + GitHub MCP + OpenAI) — sync generate + 6 b. Lower ceiling. Inštalácia: [`09`](./09-nasadenie.md).

---

## 4. JUDGED

| Bod | Ako |
|-----|-----|
| Best Feedback Incorporation | Po feedbacku: zmena v `doc/` + implementácia |
| Crowd Favourite | Demo: URL → README + mapa + PR comment live |

---

## 5. Čo už „splíname“ na úrovni špecifikácie

| Zadanie / REACH FOR | Spec |
|---------------------|------|
| SDD | `00`, proces |
| Public repo → README + arch map | `02`, `05` |
| GitHub MCP + file tree | `04` |
| Template README | `05` |
| Action PR comment | `06` **uzavreté** |
| Public API | `06` **uzavreté** |
| Prieskum | `03` |

**Ešte neuzavreté / necommitnuté:** `06` otvorené otázky · commit `doc/` · app kód · testy · deploy · MCP server surface.

---

## 6. Odporúčané poradie (body × zadanie)

1. Uzavrieť `06` + **commit `doc/`** → GATE 15 + Spec Before Code 10  
2. Implementovať MVP zo zadania: MCP consume · agent · generate · Action · Public API  
3. Deploy API na Workers/Vercel/… → Lower ceiling + Edge Workers  
4. Real Auth (API key) + sticky PR comment  
5. **Docwright MCP server** (Built An MCP) — ten istý generate  
6. Tests From Spec + Agent-Driven Testing  
7. Streaming (nice demo)  
8. Worktrees / Custom tooling / Compaction — ak ostane čas  
9. Po feedbacku: Spec Updated After Feedback  

**Nerobiť:** Stripe, Vision, mobile-only UI, quality/security scorecard (drift).
