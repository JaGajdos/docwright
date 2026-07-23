# Slice 03 — MCP stdio + agent loop

## Cieľ
V `packages/core` (alebo `apps/api` helper): spustiť **GitHub MCP ako stdio child**, OpenAI **tool-calling agent**, výstup README + Mermaid podľa template.

## Scope
- Spawn MCP child (`GITHUB_PERSONAL_ACCESS_TOKEN` / `GITHUB_TOKEN`)
- MCP client: tools `get_repository_tree`, `get_file_contents`
- Agent loop: max 12 rounds, system prompt z [`doc/11`](../doc/11-implementacne-rozhodnutia.md)
- 1× Mermaid retry + text fallback
- Funkcia `generateDocs({ owner, repo, ref?, language? })` → `GenerateDocsOutput` (`05`/`06`)
- Lokálne spustenie cez jednoduchý script (`npm run generate -- owner/repo`) na overenie

## Mimo scope
- HTTP rate limit / CORS
- Web UI
- GitHub Action
- Deploy

## Predpoklady
- Lokálne env: `OPENAI_API_KEY`, `GITHUB_TOKEN`
- Slice 02 hotový

## Acceptance
- [x] Agent najprv zavolá tree tool (test + prompt; round 0 `tool_choice: required`)
- [x] Generate API: `generateDocs()` → README + Mermaid (+ PR comment)
- [x] Limity súborov (`withFileReadLimit`)
- [x] MCP session `close()` v `finally`
- [x] CLI: `npm run generate -- owner/repo`
- [x] Unit testy s mock OpenAI/MCP (19 tests v core)

**Stav:** done  

**Poznámka:** Live generate potrebuje `OPENAI_API_KEY` + `GITHUB_TOKEN` a Docker (default MCP) alebo `DOCWRIGHT_MCP_COMMAND` na binárku `github-mcp-server`.

## Spec
`doc/04` · `doc/05` · `doc/11` §2–§3
