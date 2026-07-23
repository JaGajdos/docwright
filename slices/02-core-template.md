# Slice 02 — Core: template, parse, limity

## Cieľ
`packages/core`: parse repo URL, načítanie template, limity, skrátenie README pre PR — **bez** MCP/OpenAI.

## Scope
- `parseRepoInput(url | owner/repo)` → `{ owner, repo, ref? }`
- Load default template z `templates/readme.md`
- Konštanty / config limity (`max_files_read`, bytes, `max_tool_rounds`) z env s defaultmi
- `buildPrCommentMarkdown({ architecture, readmeSummary, sha })` + marker `<!-- docwright-bot -->`
- `summarizeReadme(fullMarkdown)` — skrátený výstup pre PR (title + What it is + Quick start)
- Unit testy Vitest na parse + template path

## Mimo scope
- Volanie MCP / OpenAI
- HTTP server
- Web UI

## Acceptance
- [x] Validné GitHub URL a `owner/repo` sa parsujú
- [x] Neplatný vstup → jasná chyba / null podľa API kontraktu neskôr
- [x] Template súbor sa načíta a obsahuje `{{project_name}}` atď.
- [x] PR comment obsahuje marker z `06`/`11`
- [x] Vitest: aspoň parse + marker

**Stav:** done

## Spec
`doc/04` limity · `doc/05` template · `doc/06` komentár · `doc/11`
