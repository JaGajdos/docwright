import mermaid from "mermaid";
import { marked } from "marked";
import DOMPurify from "dompurify";

let mermaidReady = false;

function ensureMermaid(): void {
  if (mermaidReady) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "strict",
  });
  mermaidReady = true;
}

export async function renderMermaid(
  source: string,
  target: HTMLElement,
  fallbackEl: HTMLElement,
): Promise<void> {
  target.innerHTML = "";
  fallbackEl.hidden = true;
  fallbackEl.textContent = "";

  const trimmed = source.trim();
  if (!trimmed) {
    fallbackEl.hidden = false;
    fallbackEl.textContent = "No architecture diagram returned.";
    return;
  }

  try {
    ensureMermaid();
    const id = `dw-${Date.now()}`;
    const { svg } = await mermaid.render(id, trimmed);
    target.innerHTML = svg;
  } catch {
    fallbackEl.hidden = false;
    fallbackEl.textContent = trimmed;
  }
}

export function renderReadme(markdown: string, target: HTMLElement): void {
  const html = marked.parse(markdown, { async: false }) as string;
  target.innerHTML = DOMPurify.sanitize(html);
}
