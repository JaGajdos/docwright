# Slice 08 — Testy zo spec

## Cieľ
Vitest pokrytie podľa [`doc/10`](../doc/10-prevadzka-mvp.md) §7 — *Tests From The Spec*.

## Scope
- `packages/core`: parse, limity, template, mermaid fallback helper, PR marker, mock agent/MCP tool order ak ide
- `apps/api`: 400 / 429 (mock rate store) / 200 shape (mock generate)
- `apps/web`: error message mapovanie (ľahký test)
- `action`: sticky find/update logika (unit, mock octokit)
- `npm test` z rootu spustí workspaces testy

## Mimo scope
- Live E2E proti OpenAI/GitHub v CI (optional manuál)
- Load/perf testy

## Acceptance
- [x] `npm test` zelené bez sieťových volaní (mocky)
- [x] Minimálne checklist z `doc/10` §7 pokrytý
- [x] Žiadne flaky testy závislé na rate limitoch live API

## Spec
`doc/10` §7 · acceptance v `04`–`06` · `doc/11`
