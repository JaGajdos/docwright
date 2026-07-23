# Slice 01 — Scaffold monorepo

## Cieľ
Založiť **npm workspaces** štruktúru podľa [`doc/10`](../doc/10-prevadzka-mvp.md) a [`doc/11`](../doc/11-implementacne-rozhodnutia.md). Žiadna business logika.

## Scope
- Root `package.json` s workspaces: `packages/*`, `apps/*`, `action`
- Priečinky: `packages/core`, `apps/api`, `apps/web`, `action`
- TypeScript baseline (shared `tsconfig` ak treba)
- `templates/readme.md` už existuje — nechať
- `.gitignore` (node_modules, dist, .env)
- Root README: 1 odstavec + odkaz na `doc/`

## Mimo scope
- MCP, OpenAI, UI, deploy, testy

## Acceptance
- [x] `npm install` v roote prebehne
- [x] Workspaces sú viditeľné (`npm ls -ws` alebo ekvivalent)
- [x] Žiadny app kód mimo scaffold / placeholder `package.json`
- [x] Štruktúra sedí so spec

**Stav:** done

## Spec
`doc/10` §1 · `doc/11` §1
