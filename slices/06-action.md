# Slice 06 — GitHub Action (sticky comment)

## Cieľ
`action/`: pri PR zavolať Railway API a **sticky** komentár (create/update) podľa [`doc/11`](../doc/11-implementacne-rozhodnutia.md) §5.

## Scope
- `action.yml` + JS/TS entrypoint
- Inputs: `api-url`, `api-key`, `github-token`
- Context: owner, repo, PR number, head ref/sha
- `POST {api-url}/v1/generate` s Bearer
- Sticky: list issue comments → nájsť `<!-- docwright-bot -->` → PATCH alebo POST
- Body: full architecture + skrátený README (z API `prCommentMarkdown` alebo core builder)
- Example workflow `.github/workflows/docwright-pr.yml`
- Permissions: `contents: read`, `pull-requests: write`

## Mimo scope
- OpenAI/MCP v Action (len klient API)
- Auto-commit súborov
- Marketplace listing

## Acceptance
- [x] Sticky create/update logika + API klient (unit testy)
- [x] Example workflow `.github/workflows/docwright-pr.yml`
- [x] Inputs: `api-url`, `api-key`, `github-token`; permissions v example
- [ ] Live test PR proti produkčnému API (slice 07)

## Spec
`doc/06` · `doc/09` §3.4–3.5 · `doc/11` §5
