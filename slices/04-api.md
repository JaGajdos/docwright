# Slice 04 — Public API

## Cieľ
`apps/api`: HTTP `POST /v1/generate` — sync, CORS, rate limit, error kódy; volá `generateDocs` z core (Agent+MCP).

## Scope
- Server (Hono alebo Express) — Node 20
- `POST /v1/generate` body podľa `06`
- Web: bez povinného Bearer; Action: optional/required `Authorization: Bearer DOCWRIGHT_API_KEY` podľa spec (`06`: Action s key)
- Rate limit per IP: 5/h, 20/day (in-memory OK)
- Chyby: `INVALID_REPO`, `REPO_INACCESSIBLE`, `RATE_LIMITED`, `LLM_UNAVAILABLE`, `TIMEOUT`, `AGENT_LIMIT`
- CORS z `CORS_ORIGINS`
- Timeout ~120 s
- Disclaimer nie v API JSON povinný; `warnings` áno
- `.env.example` pre Railway premenné

## Mimo scope
- Frontend
- Action workflow
- Health endpoint (zámerne nie)

## Acceptance
- [x] `POST /v1/generate` → 200 JSON shape (mocked generate v testoch)
- [x] Zlá / chýbajúca `repo` → 400 `INVALID_REPO`
- [x] Rate limit → 429
- [x] CORS middleware (CORS_ORIGINS)
- [x] Bearer: zlý key → 401; web bez key OK
- [x] Timeout wrapper + error mapping

**Stav:** done  

Lokálne: `npm run dev -w @docwright/api` (port 8787). Live generate potrebuje env z `.env.example`.

## Spec
`doc/06` · `doc/09` env · `doc/10` §2–§4
