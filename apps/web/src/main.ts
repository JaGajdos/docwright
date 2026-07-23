import "./styles.css";
import { generateDocs } from "./api.js";
import { userMessageForError } from "./errors.js";
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
const results = document.querySelector<HTMLElement>("#results")!;
const mermaidOut = document.querySelector<HTMLDivElement>("#mermaid-out")!;
const mermaidFallback = document.querySelector<HTMLPreElement>("#mermaid-fallback")!;
const readmeOut = document.querySelector<HTMLElement>("#readme-out")!;

const DEMO_REPO = "https://github.com/sindresorhus/is";

demoBtn.addEventListener("click", () => {
  repoInput.value = DEMO_REPO;
  repoInput.focus();
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
  setGenerateLoading(submitBtn, loaderTitle, loading, undefined, loaderEl);
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

  try {
    const data = await generateDocs({
      repo: repoInput.value.trim(),
      language: languageSelect.value,
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
      mermaidFallback.textContent =
        diagramSource || "No architecture diagram returned.";
    }

    renderReadme(data.readmeMarkdown || "_Empty README._", readmeOut);
    setResultsVisible(true);
    showWarnings(data.warnings ?? []);
  } catch (err) {
    showError(userMessageForError(err));
  } finally {
    setLoading(false);
  }
});
