import mermaid from "mermaid";
import { marked } from "marked";
import DOMPurify from "dompurify";

let mermaidReady = false;

/** Quote labels with @ / spaces so mermaid.render does not fail. */
export function sanitizeMermaidLabels(source: string): string {
  const needsQuotes = /[@/().:[\]\\|<>{}#&]|^\d|\s/;
  const quote = (label: string): string => {
    const t = label.trim();
    if (
      (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'"))
    ) {
      return t;
    }
    if (!needsQuotes.test(t)) return t;
    return `"${t.replace(/"/g, "#quot;")}"`;
  };
  return source.replace(
    /\b([A-Za-z][\w]*)\[([^\]]+)\]/g,
    (_m, id: string, label: string) => `${id}[${quote(label)}]`,
  );
}

function ensureMermaid(): void {
  if (mermaidReady) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
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

  const trimmed = sanitizeMermaidLabels(source.trim());
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
  } catch (err) {
    fallbackEl.hidden = false;
    fallbackEl.textContent =
      trimmed +
      "\n\n---\nRender error: " +
      (err instanceof Error ? err.message : String(err));
  }
}

export function renderReadme(markdown: string, target: HTMLElement): void {
  const html = marked.parse(markdown, { async: false }) as string;
  target.innerHTML = DOMPurify.sanitize(html);
}
