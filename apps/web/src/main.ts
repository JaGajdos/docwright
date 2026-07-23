import "./styles.css";
import { generateDocs } from "./api.js";
import { userMessageForError } from "./errors.js";
import {
  applyLocale,
  getLocale,
  normalizeLocale,
  t,
} from "./i18n.js";
import { setGenerateLoading } from "./loading.js";
import { renderMermaid, renderReadme } from "./render.js";

const form = document.querySelector<HTMLFormElement>("#form")!;
const repoInput = document.querySelector<HTMLInputElement>("#repo")!;
const languageSelect = document.querySelector<HTMLSelectElement>("#language")!;
const submitBtn = document.querySelector<HTMLButtonElement>("#submit")!;
const demoBtn = document.querySelector<HTMLButtonElement>("#demo")!;
const loaderEl = document.querySelector<HTMLDivElement>("#loader")!;
const loaderTitle = document.querySelector<HTMLParagraphElement>("#loader-title")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const warningsEl = document.querySelector<HTMLDivElement>("#warnings")!;
const warningsList = document.querySelector<HTMLUListElement>("#warnings-list")!;
const errorEl = document.querySelector<HTMLParagraphElement>("#error")!;
const proNudge = document.querySelector<HTMLDivElement>("#pro-nudge")!;
const results = document.querySelector<HTMLElement>("#results")!;
const mermaidOut = document.querySelector<HTMLDivElement>("#mermaid-out")!;
const mermaidFallback = document.querySelector<HTMLPreElement>("#mermaid-fallback")!;
const readmeOut = document.querySelector<HTMLElement>("#readme-out")!;
const scanRadios = document.querySelectorAll<HTMLInputElement>('input[name="scan"]');

const DEMO_REPO = "https://github.com/JaGajdos/docwright";

const savedLang = normalizeLocale(localStorage.getItem("docwright.lang"));
languageSelect.value = savedLang;
applyLocale(savedLang);

demoBtn.addEventListener("click", () => {
  repoInput.value = DEMO_REPO;
  repoInput.focus();
});

languageSelect.addEventListener("change", () => {
  const locale = normalizeLocale(languageSelect.value);
  localStorage.setItem("docwright.lang", locale);
  applyLocale(locale);
});

function selectedScan(): "quick" | "deep" {
  const checked = document.querySelector<HTMLInputElement>(
    'input[name="scan"]:checked',
  );
  return checked?.value === "deep" ? "deep" : "quick";
}

function syncProNudge(): void {
  const deep = selectedScan() === "deep";
  proNudge.hidden = !deep;
}

scanRadios.forEach((radio) => {
  radio.addEventListener("change", syncProNudge);
});

function showError(message: string): void {
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function clearError(): void {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function clearWarnings(): void {
  warningsEl.hidden = true;
  warningsList.innerHTML = "";
}

function showWarnings(warnings: string[]): void {
  if (!warnings.length) {
    clearWarnings();
    return;
  }
  warningsList.innerHTML = "";
  for (const w of warnings) {
    const li = document.createElement("li");
    li.textContent = w;
    warningsList.appendChild(li);
  }
  warningsEl.hidden = false;
}

function setResultsVisible(visible: boolean): void {
  results.hidden = !visible;
  document.body.classList.toggle("has-results", visible);
}

function setLoading(loading: boolean): void {
  setGenerateLoading(
    submitBtn,
    loaderTitle,
    loading,
    t("loaderTitle"),
    loaderEl,
  );
  document.body.classList.toggle("is-loading", loading);
  if (loading) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    clearWarnings();
  }
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  clearError();
  clearWarnings();
  setResultsVisible(false);
  setLoading(true);

  if (selectedScan() === "deep") {
    syncProNudge();
  }

  const language = normalizeLocale(languageSelect.value);

  try {
    const data = await generateDocs({
      repo: repoInput.value.trim(),
      language,
    });

    const diagramSource =
      data.architectureMermaid?.trim() ||
      data.architectureFallbackText?.trim() ||
      "";

    if (data.architectureMermaid?.trim()) {
      await renderMermaid(data.architectureMermaid, mermaidOut, mermaidFallback);
    } else {
      mermaidOut.innerHTML = "";
      mermaidFallback.hidden = false;
      mermaidFallback.textContent = diagramSource || t("noDiagram");
    }

    renderReadme(data.readmeMarkdown || t("emptyReadme"), readmeOut);
    setResultsVisible(true);
    showWarnings(data.warnings ?? []);
  } catch (err) {
    showError(userMessageForError(err, getLocale()));
  } finally {
    setLoading(false);
  }
});
