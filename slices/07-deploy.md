# Slice 07 — Deploy (Pages + Railway)

## Cieľ
Živý produkt: frontend na **GitHub Pages**, API (Agent+MCP) na **Railway**, default URL.

## Scope
- Railway: service z repo / `apps/api`, env podľa `09`  
  (`OPENAI_API_KEY`, `GITHUB_TOKEN`, `DOCWRIGHT_API_KEY`, `CORS_ORIGINS`, …)
- Overiť MCP child na Railway
- GitHub Pages: workflow `deploy-pages.yml`, `VITE_API_URL`
- Prepojiť Action secrets na produkčné Railway URL
- Checklist z `09` §4

## Mimo scope
- Custom doména
- Health endpoint
- Multi-env staging

## Acceptance
- [x] Deploy config: `Dockerfile`, `railway.toml`, `deploy-pages.yml`
- [ ] Pages URL otvoriteľná bez loginu (po zapnutí Pages + secrets)
- [ ] Generate proti live Railway OK
- [ ] CORS funguje
- [ ] Test PR → sticky komentár z produkčného API
- [ ] Demo link pripravený na zdieľanie

## Manuálne kroky (ty)
1. **Railway:** New Project → Deploy from this repo (Dockerfile). Variables: `OPENAI_API_KEY`, `GITHUB_TOKEN`, `DOCWRIGHT_API_KEY`, `CORS_ORIGINS=https://<user>.github.io`.
2. **GitHub:** Settings → Pages → Source = GitHub Actions. Variable `VITE_API_URL` = Railway URL. Secrets `DOCWRIGHT_API_URL` + `DOCWRIGHT_API_KEY` pre PR workflow.
3. Push na `main` → Pages deploy; otvor PR → sticky comment.

## Spec
`doc/09` celý
