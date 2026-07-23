# Slice 05 — Web app

## Cieľ
`apps/web` (Vite): koncový user zadá GitHub URL → Generate → README + architecture mapa. Bez loginu.

## Scope
- Jedna hlavná obrazovka (`08`)
- Input + Generate + loading
- Volanie `VITE_API_URL/v1/generate`
- Render Mermaid cez knižnicu **`mermaid`**
- README cez `marked` + DOMPurify (alebo ekvivalent)
- Error stavy podľa `10` §4
- Disclaimer v pätičke (`10` §9)
- Základný responsive (tabs mobile / side-by-side desktop — podľa `08`)
- Optional: EN/SK prepínač (`language` v body)

## Mimo scope
- Login, API key v UI
- Deploy Pages (slice 07)
- Action

## Acceptance
- [x] Bez účtu: URL → viditeľný README + diagram
- [x] Loading disable button
- [x] 429/404/400 texty zrozumiteľné
- [x] Žiadny secret v klientskom bundle (len `VITE_API_URL`)
- [x] Disclaimer viditeľný

## Spec
`doc/08` · `doc/10` · `doc/11` §4
