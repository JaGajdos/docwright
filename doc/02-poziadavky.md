# Požiadavky

Zdroj pravdy: [`../zadanie.txt`](../zadanie.txt).  
Proces: **SDD** — [`00-sdd.md`](./00-sdd.md). Nice-to-have mimo zadania **nie je MVP**.

## MVP (must have) — zo zadania

### Produkt

- [ ] Vstup: **ľubovoľný public GitHub repo**
- [ ] Výstup: **clean README** + **one-screen architecture map** (onboarding docs)
- [ ] **Jednoduchá web app pre koncového používateľa** (bez prihlásenia): zadať GitHub URL → zobraziť README + architektúru ([`08-web-app.md`](./08-web-app.md))
- [ ] Stack / limity / rate limit / chyby / testy / disclaimer — [`10-prevadzka-mvp.md`](./10-prevadzka-mvp.md)

### Quick start / building blocks (REACH FOR)

- [ ] Pripojenie **GitHub MCP**
- [ ] **AI agent** načíta **file tree** jedného repa
- [ ] Generovanie **README z template**
- [ ] Ship ako **GitHub Action**, ktorá **komentuje na PRy**
- [ ] **Public API** (REACH FOR — programový prístup; web app je klient API)

### Proces (zo zadania)

- [ ] Práca **Spec-Driven Development** — commitnutá `doc/` spec pred app kódom; žiadny scope drift

### Non-goals (nie v zadaní)

- Plná docs platforma (Mintlify-level) — web app = **jedna generate stránka**, nie docs site
- Privátne repá
- Auto-commit / merge dokumentácie do default branch
- Quality scorecard / security scan (mimo zadania — nerobiť v MVP)

---

## Mimo MVP

Kvalita projektu a bezpečnosť boli interný nápad — **nie sú v zadaní**. Neimplementovať, kým zadanie / feedback neskôr nedoplní scope.
