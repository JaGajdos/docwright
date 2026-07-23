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
