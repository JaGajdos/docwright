# Spec-Driven Development (SDD)

Zo zadania: **USE Spec-Driven Development (SDD)**.

Špecifikácia je **zdroj pravdy**. Kód a testy z nej vychádzajú; nie naopak.

---

## Pravidlá pre Docwright

1. **Spec pred kódom** — v `doc/` je scope, acceptance, tech rozhodnutia; app kód až potom.
2. **Žiadny scope drift** — implementovať len to, čo je v [`../zadanie.txt`](../zadanie.txt) a v schválenej spec v `doc/`.
3. **Zmena správania = zmena spec** — najprv upraviť dokument, potom kód.
4. **Acceptance zo spec** — hotové = spĺňa checklisty v docs, nie „zdá sa že funguje“.

---

## Tok práce

```
zadanie.txt  →  doc/* (spec)  →  implementácia  →  validácia voči acceptance
                      ↑_______________ feedback _______________|
```

| Fáza | Čo | Stav Docwright |
|------|-----|----------------|
| Specify | Rozklad, požiadavky, ingest, generate, delivery, web | `doc/00`–`08` |
| Clarify | Otvorené otázky uzavrieť | podľa dokumentu |
| Plan / Tasks | Tech plán + úlohy z acceptance | pred kódom |
| Implement | Agent/kód podľa spec | **až po commitnutej spec** |
| Validate | Testy / demo voči acceptance | viazané na spec |

---

## Čo patrí do `doc/` (GATE)

- Scope a non-goals
- Acceptance criteria
- Tech spec krokov (napr. získanie obsahu cez GitHub MCP)

Bez commitnutej spec zložky nezačínať app kód.
