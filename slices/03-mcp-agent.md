# Slice 03 — MCP stdio + agent loop

## Cieľ
V `packages/core`: spustiť **MCP provider** (default GitHub ako stdio child), **LLM provider** (tool-calling / Responses), výstup README + Mermaid podľa template + `config/prompts/`.

## Scope
- Spawn MCP child (`GITHUB_PERSONAL_ACCESS_TOKEN` / `GITHUB_TOKEN`)
- MCP registry: `resolveMcpProvider` podľa hostu / `DOCWRIGHT_MCP_PROVIDER` / explicit id
- MCP client: tools `get_repository_tree`, `get_file_contents`
- LLM: `createLlmProvider()` — `openai` / `azure` / `openai-compatible`
- Agent loop: limity z `config/agent.json` (default max **8** rounds)
- 1× Mermaid repair + text fallback
- Funkcia `generateDocs({ owner, repo, ref?, language?, mcpProvider? })` → `GenerateDocsOutput`
- Lokálne: `npm run generate -- owner/repo`

## Mimo scope
- HTTP rate limit / CORS
- Web UI
- GitHub Action
- Deploy
- Ďalšie MCP backendy okrem GitHub (registry API áno, implementácia GitLab atď. nie)

## Predpoklady
- Lokálne env: `OPENAI_API_KEY` (a/alebo Azure), `GITHUB_TOKEN`
- Slice 02 hotový

## Acceptance
- [x] Agent najprv zavolá tree tool (test + prompt; round 0 `tool_choice: required`)
- [x] Generate API: `generateDocs()` → README + Mermaid (+ PR comment)
- [x] Limity súborov (`withFileReadLimit`)
- [x] MCP session `close()` v `finally`
- [x] CLI: `npm run generate -- owner/repo`
- [x] Unit testy s mock LLM/MCP
- [x] LLM provider factory + MCP provider registry

**Stav:** done  

**Poznámka:** Live generate potrebuje LLM credentials + `GITHUB_TOKEN` a Docker (default MCP) alebo `DOCWRIGHT_MCP_COMMAND` na binárku `github-mcp-server`.

## Spec
`doc/04` · `doc/05` · `doc/11` §2–§3 · `packages/core/src/llm/README.md` · `packages/core/src/mcp/README.md`
