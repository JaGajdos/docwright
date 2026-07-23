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
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const errorEl = document.querySelector<HTMLParagraphElement>("#error")!;
const results = document.querySelector<HTMLDivElement>("#results")!;
const mermaidOut = document.querySelector<HTMLDivElement>("#mermaid-out")!;
const mermaidFallback = document.querySelector<HTMLPreElement>("#mermaid-fallback")!;
const readmeOut = document.querySelector<HTMLElement>("#readme-out")!;
const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");

const DEMO_REPO = "https://github.com/sindresorhus/is";

function setTab(name: string): void {
  tabs.forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  document.querySelectorAll<HTMLElement>(".panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${name}`);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setTab(tab.dataset.tab ?? "architecture"));
});

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

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  clearError();
  results.hidden = true;
  setGenerateLoading(submitBtn, statusEl, true);

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
    results.hidden = false;
    setTab("architecture");

    if (data.warnings?.length) {
      statusEl.hidden = false;
      statusEl.textContent = `Done (warnings: ${data.warnings.length}).`;
    } else {
      statusEl.hidden = true;
    }
  } catch (err) {
    showError(userMessageForError(err));
    statusEl.hidden = true;
  } finally {
    setGenerateLoading(submitBtn, statusEl, false);
  }
});
