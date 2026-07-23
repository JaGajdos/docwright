# Rozklad zadania

Zdroj: `zadanie.txt`

## Spôsob práce (zo zadania)

- **USE Spec-Driven Development (SDD)** — spec v `doc/` je zdroj pravdy; kód až po špecifikácii.
- Detail procesu: [`00-sdd.md`](./00-sdd.md).

## Produktová vízia

- Nástroj, ktorý dopĺňa chýbajúcu dokumentáciu v repozitároch  
  („docs your repo never got around to writing“).
- Vstup: ľubovoľný **public GitHub repo**.
- Výstup: **čistý README** + **jednostránková architecture mapa**  
  (onboarding dokumentácia, ktorú si projekt zaslúži a takmer nikdy nemá).

## Core value

- Rýchly onboarding do cudzieho / vlastného projektu bez manuálneho písania docs.
- Produkt je **štartovací bod prieskumu** codebase („jump to exploration“), nie plná docs platforma (aspoň na začiatku).

## Referenčné / konkurenčné produkty (CLONES)

- **Mintlify** — dokumentačné platformy / AI docs.
- **CodeRabbit-style doc tools** — AI asistenti nad PRami / kódom  
  (štýl automatizovaných review / docs komentárov).

## Technologický stack (REACH FOR)

| Building block | Úloha |
|----------------|--------|
| GitHub MCP | Prístup k súborom, stromu, metadátam repo |
| AI agent | Generovanie README a architecture mapy |
| GitHub Actions | Automatizácia v CI (napr. pri PR) |
| Public API | Programový prístup (nielen UI / chat) |

## MVP Quick start (explicitne v zadaní)

1. Pripojiť **GitHub MCP**.
2. Agent prečíta **file tree** jedného repa.
3. Vygenerovať **README z template**.
4. Nasadiť ako **GitHub Action**, ktorá **komentuje na nové PRy**.

## Rozhodnutia zo zadania (žiadny drift)

| Plocha | Zo zadania |
|--------|-------------|
| Vstup | Public GitHub repo |
| Ingest | GitHub MCP + agent číta **file tree** |
| Výstup | Clean README (z **template**) + **one-screen** architecture map |
| Delivery | GitHub Action **komentuje na nové PRy** |
| REACH FOR | GitHub MCP · AI agent · GitHub Actions · Public API |

Implementačný detail (formát mapy, limity kontextu) sa špecifikuje neskôr — **bez** pridávania quality/security/docs-site scope.
