# Web aplikácia — produkt pre koncového používateľa

Špecifikácia **hotového, jednoducho použiteľného** produktu: zadať GitHub URL → dostať README + architecture map.  
Nadväzuje na Public API [`06`](./06-dorucenie-action-api.md).  
Produktová veta: *Point Docwright at any public GitHub repo and it hands back…*

Web app = **primárny spôsob použitia** pre človeka. API a Action ostávajú (zadanie / integrácie), ale demo a „hotový produkt“ = táto stránka.

**Zatiaľ neriešime prihláseného používateľa** — žiadny login, účet, ani API key v UI.

---

## 1. Cieľová skúsenosť

Koncový používateľ (bez tech onboardingu):

1. Otvorí Docwright vo browsri  
2. Vloží adresu public GitHub repa  
3. Klikne Generate  
4. Vidí **architecture map** + **README**  

Bez registrácie, bez kľúčov, bez nastavení.

---

## 2. Ako sa Docwright používa

| Povrch | Pre koho | Poznámka |
|--------|----------|----------|
| **Web app** | Koncový používateľ | Primárny produkt UX |
| Public API | Integrácie / budúcnosť | Existuje; end-user ho priamo nepoužíva |
| GitHub Action | Tímy v CI | Zo zadania — sticky PR komentár |
| Agent + MCP | Dev quick start | Zo zadania — nie end-user flow |

---

## 3. UX

```
┌─────────────────────────────────────────────┐
│  Docwright                                  │
│  The docs your repo never got around to…    │
│                                             │
│  [ https://github.com/owner/repo     ] [Go] │
│                                             │
│  (loading…)                                 │
│                                             │
│  Architecture     │  README                 │
│  (diagram)        │  (formatted markdown)   │
└─────────────────────────────────────────────┘
```

### Musí byť
- Jedno vstupné pole (URL alebo `owner/repo`)
- Jedno primárne CTA (Generate)
- Loading / progress pri čakaní na sync API
- Výstup: mapa (Mermaid render) + README (markdown render)
- Jasné chyby (neplatná URL, repo neexistuje, timeout, dočasná chyba)
- Použiteľné na mobile (základný responsive)

### Nesmie byť (MVP)
- Login / signup / „Account“
- Pole na API key pre end-usera
- Dashboard, história účtov, billing
- Multi-page docs site, nastavenia projektu

### Nice (nie blocker)
- Prepínač EN / SK
- Copy / download výstupu
- Príkladové demo repo na klik

---

## 4. Auth model (uzavreté na teraz)

| Actor | Auth |
|-------|------|
| Koncový používateľ (browser) | **Žiadna** — otvorený prístup k generate UI |
| Public API z internetu | API key **alebo** len same-origin z webu |
| LLM / GitHub tokeny | Len na **serveri** (env / secrets) |

Odporúčaný tvar MVP:

```
Browser (no login) → Web (same origin) → Backend generate
                         ↑
              secrets len tu (LLM, GitHub token)
```

- End-user **nevidí** a **nevyplína** API key.  
- Abuse ochrana neskôr (rate limit per IP) — nie login.  
- Až keď budeme riešiť prihláseného usera: vtedy upraviť túto spec (SDD).

---

## 5. Technický tok

```
User  →  GitHub Pages (frontend)  →  Railway POST /v1/generate
                                         →  Agent + MCP provider + LLM provider
User  ←  README + architecture na stránke
```

- Frontend: **Vite + plain TypeScript** (nie React)
- dependency `mermaid` — render architecture map ([`11`](./11-implementacne-rozhodnutia.md))
- README panel: markdown render (napr. `marked` + DOMPurify)

---

## 6. Nasadenie (súhrn)

| Časť | Kde |
|------|-----|
| Frontend (tento UX) | **GitHub Pages** (Vite build) |
| Backend | **Railway** — Agent + MCP + LLM ([`09`](./09-nasadenie.md)) |
| PR komentár | GitHub Action → volá Railway |

Pages **sama** nestačí — backend musí bežať inde.

---

## 7. Acceptance

- [ ] Používateľ bez účtu otvorí app, zadá public GitHub URL, dostane README + mapu
- [ ] V UI nie je login ani API key
- [ ] Secrets sú len server-side
- [ ] Chyby sú zrozumiteľné pre bežného používateľa
- [ ] Jedna hlavná obrazovka = hotový produktový flow (nie docs platforma)
- [ ] Základne použiteľné na mobile

- [ ] Frontend nasadený na **GitHub Pages**; backend na **Railway** (Agent+MCP) ([`09`](./09-nasadenie.md))

---

## 8. Rozhodnutia

| # | Rozhodnutie |
|---|-------------|
| 1 | Primárny UX = **jednoduchá web app** pre koncového usera |
| 2 | **Bez prihlásenia** v MVP |
| 3 | API key / secrets **nie v UI** — len backend |
| 4 | Layout: desktop side-by-side alebo tabs; mobile tabs — implementačný detail |
| 5 | Streaming do UI = neskôr; MVP = sync loading |
| 6 | Deploy: **GitHub Pages** + **Railway (Agent+MCP)** — default URL — [`09`](./09-nasadenie.md) |
