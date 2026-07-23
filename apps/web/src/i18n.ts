export type Locale = "en" | "sk";

export type MessageKey = keyof typeof en;

const en = {
  tagline: "The docs your repo never got around to writing.",
  repoLabel: "GitHub repository",
  repoPlaceholder: "https://github.com/owner/repo",
  generate: "Generate",
  language: "Language",
  scanDepth: "Scan depth",
  scanQuick: "Quick scan",
  scanDeep: "Deep scan",
  scanPro: "Pro",
  tryExample: "Try example repo",
  proNudgeHtml:
    "<strong>Deep scan</strong> reads more of the repo (packages, entry points, CI) and drafts richer docs — available on Pro.",
  seePlans: "See plans",
  loaderTitle: "Generating docs…",
  loaderHint:
    "Reading the repo and drafting README + architecture. This can take a minute or two.",
  readme: "README",
  architecture: "Architecture",
  warningsTitle: "Generated with notes",
  noDiagram: "No architecture diagram returned.",
  emptyReadme: "_Empty README._",
  upsellAria: "Upgrade scan",
  upsellKicker: "Go deeper",
  upsellTitle: "This was a Quick scan",
  upsellText:
    "Free scans sample the tree and a few key files. Pro Deep scan walks packages, apps, and CI so README and architecture match larger monorepos.",
  upsellCta: "Unlock Deep scan",
  plansHeading: "What Docwright does",
  plansIntro:
    "Point Docwright at a public GitHub repo and it drafts a clean README plus a one-screen architecture map. Paid plans simply go further — deeper scans, private repos, and docs that stay up to date.",
  planFree: "Free",
  planFreePrice: "€0",
  planFreeDesc: "Public repos, Quick scan",
  planFree1: "Tree + a few key files",
  planFree2: "README + architecture map",
  planFree3: "Rate-limited generates",
  planFreeFoot: "What you use today",
  planBadge: "Best fit",
  planPro: "Pro",
  planProPriceSuffix: "/mo",
  planProDesc: "Deep project scanning",
  planPro1: "Deep scan: more files & packages",
  planPro2: "Larger repos without early cutoff",
  planPro3: "Private repos (GitHub App)",
  planPro4: "Custom prompt & README template",
  planPro5: "Export + higher limits",
  comingSoon: "Coming soon",
  planTeam: "Team",
  planTeamDesc: "Docs that stay current",
  planTeam1: "Everything in Pro",
  planTeam2: "PR Action on every merge",
  planTeam3: "Docs drift alerts",
  planTeam4: "Shared org templates",
  planTeam5: "Priority model / queue",
  footer:
    "Docwright uses AI to draft documentation from public repository content. Output may be incomplete or incorrect — always review before use. Only public GitHub repositories are supported. Rate limits apply.",
  compareHeading: "How Docwright compares",
  compareSub: "Deeper look at Docwright vs main competitors.",
  compareColTool: "Tool",
  compareColNoLogin: "No login",
  compareColArch: "Architecture diagram",
  compareColLang: "Output language",
  compareColHalluc: "Anti-hallucination",
  compareColPrice: "Price",
  compareColOss: "Open source",
  compareColOutput: "Output",
  compareDw: "Docwright (ours)",
  compareDwNoLogin: "Yes — no account",
  compareDwArch: "Yes — Mermaid tailored to the repo",
  compareDwLang: "Yes — EN/SK (more planned)",
  compareDwHalluc:
    "Yes — badges come from real GitHub API / workflow data, never guessed",
  compareDwPrice: "Free (Railway ~$5/mo after credits)",
  compareDwOss: "Yes — our code; private repo",
  compareDwOutput: "README + diagram, download / copy",
  compareDeep: "DeepWiki (Cognition)",
  compareDeepNoLogin: "Yes — for public repos (deepwiki.com URL)",
  compareDeepArch: "Yes",
  compareDeepLang: "Unconfirmed",
  compareDeepHalluc: "Unknown (black box)",
  compareDeepPrice: "Free for public repos",
  compareDeepOss: "No (proprietary; community clone exists separately)",
  compareDeepOutput: "Hosted wiki + chat over code",
  compareMint: "Mintlify (repo-to-docs)",
  compareMintNoLogin: "Yes (mintlify.com URL)",
  compareMintArch: "Not primary — structured docs instead",
  compareMintLang: "Unknown",
  compareMintHalluc: "Unknown",
  compareMintPrice: "Free base; AI auto-update is paid",
  compareMintOss: "No",
  compareMintOutput: "Hosted / cloneable docs site",
  compareCr: "CodeRabbit",
  compareCrNoLogin: "No — GitHub App install required",
  compareCrArch: "Yes, but only as PR context — not whole-repo README",
  compareCrLang: "Unknown",
  compareCrHalluc: "Unknown",
  compareCrPrice: "Free (review); Pro ~$24–30/dev/mo",
  compareCrOss: "No",
  compareCrOutput: "PR comments",
  compareRcg: "ReadmeCodeGen.com",
  compareRcgNoLogin: "Yes",
  compareRcgArch: "Yes (file-tree / Mermaid)",
  compareRcgLang: "Unknown",
  compareRcgHalluc: "Unknown",
  compareRcgPrice: "Free",
  compareRcgOss: "No",
  compareRcgOutput: "Downloadable README",
  compareParity:
    "Market fit: all of these (except CodeRabbit) offer no-login access for public repos and generate some form of diagram/docs with an LLM over repo content — Docwright follows that proven pattern.",
  compareDiff:
    "Where Docwright stands out: you can verify that badges (license / version / CI) are real GitHub data, not model guesses — others either skip this or keep it opaque. Docwright also offers an explicit output-language choice and a readable pipeline codebase. DeepWiki has far broader reach (50k+ indexed repos, code chat, MCP) — Docwright is intentionally narrower: one README + one diagram on demand, not a hosted wiki platform.",
  errInvalidRepo: "Check the repo address (public GitHub).",
  errRepoInaccessible: "Repo was not found or is not public.",
  errRateLimited: "Too many requests. Try again later.",
  errTimeout: "Temporary problem. Try again.",
  errLlm: "Temporary problem. Try again.",
  errMcp: "GitHub MCP unavailable. Check GITHUB_TOKEN on Railway.",
  errAgentLimit: "Temporary problem. Try again.",
  errUnauthorized: "Temporary problem. Try again.",
  errNetwork: "Could not reach the API. Is Docwright API running?",
  errGeneric: "Temporary problem. Try again.",
  errJson: "Temporary problem. Try again.",
} as const;

const sk: Record<MessageKey, string> = {
  tagline: "Dokumentácia, ktorú tvoje repo nikdy nestihlo napísať.",
  repoLabel: "GitHub repozitár",
  repoPlaceholder: "https://github.com/owner/repo",
  generate: "Generovať",
  language: "Jazyk",
  scanDepth: "Hĺbka skenu",
  scanQuick: "Rýchly sken",
  scanDeep: "Hlboký sken",
  scanPro: "Pro",
  tryExample: "Vyskúšať príklad",
  proNudgeHtml:
    "<strong>Hlboký sken</strong> prečíta viac z repa (packages, entry pointy, CI) a pripraví bohatšie docs — dostupné v Pro.",
  seePlans: "Pozrieť plány",
  loaderTitle: "Generujem dokumentáciu…",
  loaderHint:
    "Čítam repo a pripravujem README + architektúru. Môže to trvať minútu alebo dve.",
  readme: "README",
  architecture: "Architektúra",
  warningsTitle: "Vygenerované s poznámkami",
  noDiagram: "Architektúrny diagram nebol vrátený.",
  emptyReadme: "_Prázdne README._",
  upsellAria: "Rozšíriť sken",
  upsellKicker: "Choď hlbšie",
  upsellTitle: "Toto bol rýchly sken",
  upsellText:
    "Bezplatný sken vezme strom a pár kľúčových súborov. Pro hlboký sken prejde packages, apps a CI, aby README a architektúra sedeli aj na väčšie monorepá.",
  upsellCta: "Odomknúť hlboký sken",
  plansHeading: "Čo Docwright robí",
  plansIntro:
    "Ukáž Docwrightu public GitHub repo a dostaneš čisté README plus mapu architektúry na jednu obrazovku. Za poplatok vie ísť ďalej — hlbší sken, súkromné repá a docs, ktoré ostávajú aktuálne.",
  planFree: "Free",
  planFreePrice: "€0",
  planFreeDesc: "Verejné repá, rýchly sken",
  planFree1: "Strom + pár kľúčových súborov",
  planFree2: "README + mapa architektúry",
  planFree3: "Obmedzený počet generovaní",
  planFreeFoot: "To, čo používaš teraz",
  planBadge: "Najlepšia voľba",
  planPro: "Pro",
  planProPriceSuffix: "/mes.",
  planProDesc: "Hlboké skenovanie projektu",
  planPro1: "Hlboký sken: viac súborov a packages",
  planPro2: "Väčšie repá bez skorého cutoffu",
  planPro3: "Súkromné repá (GitHub App)",
  planPro4: "Vlastný prompt a README šablóna",
  planPro5: "Export + vyššie limity",
  comingSoon: "Čoskoro",
  planTeam: "Team",
  planTeamDesc: "Docs, ktoré ostávajú aktuálne",
  planTeam1: "Všetko z Pro",
  planTeam2: "PR Action pri každom merge",
  planTeam3: "Upozornenia na docs drift",
  planTeam4: "Zdieľané org šablóny",
  planTeam5: "Prioritný model / fronta",
  footer:
    "Docwright používa AI na návrh dokumentácie z obsahu verejného repozitára. Výstup môže byť neúplný alebo nesprávny — pred použitím vždy skontroluj. Podporované sú len public GitHub repozitáre. Platí rate limiting.",
  compareHeading: "Porovnanie Docwright",
  compareSub:
    "Hlbší pohľad na Docwright oproti hlavným konkurentom.",
  compareColTool: "Nástroj",
  compareColNoLogin: "Prístup bez loginu",
  compareColArch: "Architecture diagram",
  compareColLang: "Voľba jazyka výstupu",
  compareColHalluc: "Ochrana proti halucináciám",
  compareColPrice: "Cena",
  compareColOss: "Otvorený kód",
  compareColOutput: "Výstup",
  compareDw: "Docwright (naše)",
  compareDwNoLogin: "Áno, žiadny účet",
  compareDwArch: "Áno, Mermaid na mieru repu",
  compareDwLang: "Áno — EN/SK (ďalšie plánované)",
  compareDwHalluc:
    "Áno — badges sa počítajú z reálnych dát (GitHub API / workflow súbory), nikdy sa nehádajú",
  compareDwPrice: "Zadarmo (Railway ~$5/mesiac po kredite)",
  compareDwOss: "Áno — náš kód, súkromný repo",
  compareDwOutput: "README + diagram, na stiahnutie / skopírovanie",
  compareDeep: "DeepWiki (Cognition)",
  compareDeepNoLogin: "Áno, pre verejné repo (zmena URL na deepwiki.com)",
  compareDeepArch: "Áno",
  compareDeepLang: "Nepotvrdené",
  compareDeepHalluc: "Neznáme (black box)",
  compareDeepPrice: "Zadarmo pre verejné repo",
  compareDeepOss: "Nie (proprietárne; komunitný klon existuje samostatne)",
  compareDeepOutput: "Hostovaná wiki stránka + chat nad kódom",
  compareMint: "Mintlify (repo-to-docs)",
  compareMintNoLogin: "Áno (zmena URL na mintlify.com)",
  compareMintArch: "Nie primárne — skôr štruktúrovaná dokumentácia",
  compareMintLang: "Neznáme",
  compareMintHalluc: "Neznáme",
  compareMintPrice: "Základ zadarmo, AI auto-update je platený",
  compareMintOss: "Nie",
  compareMintOutput: "Hostovaná / klonovateľná docs stránka",
  compareCr: "CodeRabbit",
  compareCrNoLogin: "Nie — vyžaduje inštaláciu GitHub App",
  compareCrArch: "Áno, ale len ako kontext ku konkrétnemu PR, nie celorepo README",
  compareCrLang: "Neznáme",
  compareCrHalluc: "Neznáme",
  compareCrPrice: "Zadarmo (review), Pro ~$24–30/dev/mesiac",
  compareCrOss: "Nie",
  compareCrOutput: "Komentáre v PR",
  compareRcg: "ReadmeCodeGen.com",
  compareRcgNoLogin: "Áno",
  compareRcgArch: "Áno (file-tree / Mermaid)",
  compareRcgLang: "Neznáme",
  compareRcgHalluc: "Neznáme",
  compareRcgPrice: "Zadarmo",
  compareRcgOss: "Nie",
  compareRcgOutput: "README na stiahnutie",
  compareParity:
    "Zhoda s konkurenciou: všetky (okrem CodeRabbit) ponúkajú prístup bez prihlásenia pre verejné repo a generujú nejakú formu diagramu/dokumentácie pomocou LLM nad obsahom repozitára — v tomto smere Docwright robí to isté, čo trh už overil ako fungujúci prístup.",
  compareDiff:
    "Čím sa Docwright odlišuje: je jediný z tejto skupiny, kde vieš overiť, že badges (licencia / verzia / CI) sú reálne dáta z GitHub API, nie halucinácia modelu — konkurencia toto buď nerieši, alebo to nie je overiteľné (black box). Tiež ponúka explicitnú voľbu jazyka výstupu a viditeľný zdrojový kód pipeline. DeepWiki má oveľa väčší dosah (50 000+ indexovaných repozitárov, chat nad kódom, MCP) — Docwright je zámerne užší nástroj (jedno README + jeden diagram na požiadanie), nie hostovaná wiki platforma.",
  errInvalidRepo: "Skontroluj adresu repa (public GitHub).",
  errRepoInaccessible: "Repo sa nenašlo alebo nie je public.",
  errRateLimited: "Príliš veľa požiadaviek. Skús neskôr.",
  errTimeout: "Dočasný problém. Skús znova.",
  errLlm: "Dočasný problém. Skús znova.",
  errMcp: "GitHub MCP nedostupný. Skontroluj GITHUB_TOKEN na Railway.",
  errAgentLimit: "Dočasný problém. Skús znova.",
  errUnauthorized: "Dočasný problém. Skús znova.",
  errNetwork: "Nepodarilo sa spojiť s API. Beží Docwright API?",
  errGeneric: "Dočasný problém. Skús znova.",
  errJson: "Dočasný problém. Skús znova.",
};

const bundles: Record<Locale, Record<MessageKey, string>> = { en, sk };

let currentLocale: Locale = "en";

export function normalizeLocale(raw: string | null | undefined): Locale {
  return raw === "sk" ? "sk" : "en";
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: MessageKey, locale: Locale = currentLocale): string {
  return bundles[locale][key] ?? bundles.en[key] ?? key;
}

/** Apply message bundle to elements marked with data-i18n* attributes. */
export function applyLocale(locale: Locale, root: ParentNode = document): void {
  currentLocale = locale;
  if (root instanceof Document) {
    root.documentElement.lang = locale;
  }

  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as MessageKey | undefined;
    if (!key) return;
    el.textContent = t(key, locale);
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml as MessageKey | undefined;
    if (!key) return;
    el.innerHTML = t(key, locale);
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder as MessageKey | undefined;
    if (!key || !("placeholder" in el)) return;
    (el as HTMLInputElement).placeholder = t(key, locale);
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((el) => {
    const key = el.dataset.i18nAriaLabel as MessageKey | undefined;
    if (!key) return;
    el.setAttribute("aria-label", t(key, locale));
  });
}
