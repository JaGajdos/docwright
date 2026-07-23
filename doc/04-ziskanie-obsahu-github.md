# Získanie obsahu GitHub projektu

Špecifikácia podľa [`../zadanie.txt`](../zadanie.txt) — **bez rozšírenia scope**.  
SDD: tento dokument je tech spec kroku; implementácia až po schválení / commitnutí.

> **Quick start (zadanie):** *Connect the GitHub MCP, have the agent read one repo’s file tree, and generate a README from a template.*

---

## 1. Čo zadanie vyžaduje (ingest)

| Bod zadania | Význam pre tento krok |
|-------------|------------------------|
| Public GitHub repo | Vstup = public repository |
| **GitHub MCP** | Jediný spôsob načítania obsahu v agent flow |
| Agent read **file tree** | Primárny dátový vstup = strom súborov |
| AI agent | Agent volá MCP tools a pripraví kontext na generovanie |

**Výstup produktu** (ďalší krok, nie tento): clean README + one-screen architecture map.  
**Doručenie** (neskôr): GitHub Action komentuje nové PRy; Public API (REACH FOR).

---

## 2. Scope tohto kroku

### In scope
- Pripojenie **GitHub MCP**
- Agent načíta **file tree** jedného public repa
- Doplnkové načítanie súborov, ktoré agent potrebuje na README + architecture map (cez MCP `get_file_contents`) — stále v rámci „agent číta repo“, nie samostatný clone/FS pipeline

### Out of scope (nie v zadaní)
- Privátne repá
- Vlastný clone / `actions/checkout` ako náhrada MCP v agent flow
- Quality / security scannery
- Monorepo špeciálne stratégie nad rámec bežného file tree
- Cache vrstva, ranking engine ako samostatný produkt

---

## 3. Vstup

```text
public GitHub repo  →  owner + repo
voliteľne: ref (branch), inak default branch
```

Formy: `https://github.com/owner/repo` alebo `owner/repo`.

---

## 4. Ako získať content (presne podľa zadania)

```
Agent
  └── GitHub MCP (official)
        ├── get_repository_tree   ← file tree (povinné)
        └── get_file_contents     ← obsah súborov podľa potreby agentom
```

1. Pripojiť GitHub MCP.
2. Agent zavolá tree na dané `owner/repo`.
3. Agent podľa tree vyberie a načíta relevantné súbory (README, entry points, …) cez MCP.
4. Výsledok = kontext pre generovanie README z template (+ architecture map).

Žiadny druhý paralelný ingest stack v MVP agent path.

---

## 5. Výstup pre ďalší krok

Minimálny kontext, ktorý agent odovzdá generovaniu:

| Položka | Zdroj |
|---------|--------|
| File tree | `get_repository_tree` |
| Obsah vybraných súborov | `get_file_contents` |
| Identita repa | `owner`, `repo`, `ref` |

Formálny `RepoSnapshot` typ je implementačný detail — **nie požiadavka zadania**. Ak pomôže kódu, OK; nesmie viesť k tretej ceste (REST/FS) namiesto MCP v agent flow.

---

## 6. GitHub Action a Public API (hranica)

Zo zadania **REACH FOR** + Quick start:

| Building block | Úloha | Vzťah k ingestu |
|----------------|--------|-----------------|
| GitHub MCP + AI agent | Čítanie tree + generovanie | Tento dokument |
| GitHub Actions | Komentár na **nové PRy** | Delivery — nie náhrada MCP v quick start |
| Public API | Programový prístup | REACH FOR — môže spúšťať ten istý agent/flow |

Action **nekopíruje** zadanie „connect MCP“ do CI ako povinnosť; zadanie hovorí: najprv MCP+agent+README, **potom** ship ako Action čo komentuje PRy. Ingest v Action smie použiť checkout len ako implementáciu toho istého výsledku (README + mapa v komentári), bez menenia produktu.

---

## 7. MCP server, limity a konfigurácia

### 7.1 MCP server / tools (uzavreté)

| Položka | Hodnota |
|---------|---------|
| Server | Oficiálny **[github/github-mcp-server](https://github.com/github/github-mcp-server)** |
| Povinný tool | `get_repository_tree` — file tree |
| Doplnkový tool | `get_file_contents` — obsah vybraných súborov |

### 7.2 Default limity (MVP)

Cieľ: dobrý onboarding prehľad (README + one-screen mapa), nie dump celého repa. Limity chránia **LLM náklady** a kvalitu kontextu.

| Parameter | Default | Účel |
|-----------|---------|------|
| `max_files_read` | **25** | Max počet súborov načítaných cez `get_file_contents` |
| `max_file_bytes` | **100_000** (~100 KB) | Nad limit → truncate (head) alebo skip |
| `max_total_bytes` | **800_000** (~800 KB) | Soft cap na celkový text do agent kontextu |
| `tree_recursive` | **true** | File tree zo zadania; pri extrémne veľkom tree agent môže zužiť pohľad |

**File tree** sa počíta osobitne (štruktúra), nie do `max_files_read`. Do limitu 25 idú len **obsahy** súborov.

### 7.3 Priorita výberu (pri limitoch)

Agent má do limitu brať v tomto poradí (kým je budget):

1. Existujúci README / LICENSE  
2. Manifesty (`package.json`, `pyproject.toml`, `go.mod`, …)  
3. Entry points (`main`, `app`, `src/index`, …)  
4. Ďalšie podľa tree (Docker, top-level packages)

### 7.4 Konfigurovateľnosť v projekte

Defaulty vyššie sú **špecifikačné východiská**. V reálnej implementácii musia byť **konfigurovateľné** (bez zmeny kódu logiky), napr.:

- env / config súbor projektu (`DOCWRIGHT_MAX_FILES_READ`, …), a/alebo  
- parametre Public API / Action inputs  

Zmena limitu = konfigurácia, nie nová feature. Hodnoty mimo default ostávajú v súlade so zadaním (stále public repo + MCP + tree).

### 7.5 Otázky zo zadania — stav

| Otázka | Stav |
|--------|------|
| MCP vs iné v agent flow | Uzavreté: len GitHub MCP |
| Čo čítať | Uzavreté: file tree + súbory podľa potreby |
| Private repo | Uzavreté: nie |
| MCP server / tools | Uzavreté: §7.1 |
| Koľko súborov | Uzavreté: defaulty §7.2, konfigurovateľné §7.4 |

---

## 8. Riziká (v rámci tohto scope)

| Riziko | Dopad | Mitigácia |
|--------|-------|-----------|
| Veľký file tree | Token / prehľadnosť | Tree zvlášť; zužiť výber súborov; limity |
| Veľa / veľké súbory → **LLM $** | Finančné náklady, pomalý run | `max_files_read`, `max_file_bytes`, `max_total_bytes` (konfigurovateľné) |
| MCP rate limit | Nestihne generate | Token na MCP; menej `get_file_contents` |
| Slabý výber súborov | Slabý README / mapa | Priorita §7.3 |
| Príliš nízky limit | Povrchný prehľad na monorepe | Zvýšiť config; default 25 stačí na typický onboarding |
| Action ≠ MCP path | Dve implementácie | Rovnaký výstup; agent path ostáva MCP |

---

## 9. Acceptance (ingest)

- [ ] Použitý oficiálny **github/github-mcp-server**
- [ ] Agent získa **file tree** (`get_repository_tree`) jedného public repa
- [ ] Agent načíta obsah cez `get_file_contents` v rámci limitov (default §7.2)
- [ ] Limity sú v projekte **konfigurovateľné** (§7.4)
- [ ] Bez private repo, quality/security, alebo docs site

**Stav dokumentu:** ingest spec **uzavretá** pre SDD.  
Ďalší krok: [`05-readme-a-architecture-map.md`](./05-readme-a-architecture-map.md).
