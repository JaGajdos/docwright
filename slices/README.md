# Implementačné slice

Práca po vertikálnych / logických krokoch podľa SDD.  
Špec: [`../doc/`](../doc/) · zadanie: [`../zadanie.txt`](../zadanie.txt).

**Pravidlo:** jeden slice = mergeable / demoovateľný krok; acceptance zo spec; bez scope drift.

| # | Slice | Výsledok | Závisí na | Stav |
|---|--------|----------|-----------|------|
| [01](./01-scaffold.md) | Scaffold monorepo | npm workspaces | — | **done** |
| [02](./02-core-template.md) | Core: template + limity + parse | `packages/core` bez MCP | 01 | **done** |
| [03](./03-mcp-agent.md) | MCP stdio + agent loop | Generate z public repo | 02 | **done** |
| [04](./04-api.md) | Public API | `POST /v1/generate` + rate limit | 03 | **done** |
| [05](./05-web.md) | Web app | URL → README + Mermaid | 04 | **done** |
| [06](./06-action.md) | GitHub Action sticky | Action → API → PR komentár | 04 | **done** |
| [07](./07-deploy.md) | Deploy Pages + Railway | Live demo URL | 05, 06 | config ready |
| [08](./08-tests.md) | Testy zo spec | Vitest | 02–06 | **done** |

Odporúčané poradie: **01 → 02 → 03 → 04 → 05 ∥ 06 → 07 → 08** (05 a 06 môžu paralelne po 04).
