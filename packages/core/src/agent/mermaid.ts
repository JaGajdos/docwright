export type MermaidCheck = { ok: true } | { ok: false; reason: string };

/**
 * Lightweight Mermaid sanity check (not a full parser).
 */
export function validateMermaidFlowchart(source: string): MermaidCheck {
  const text = source.trim();
  if (!text) return { ok: false, reason: "empty" };
  if (text.includes("```")) {
    return { ok: false, reason: "contains markdown fences" };
  }
  if (!/^(flowchart|graph)\s+(TB|BT|LR|RL|TD)\b/m.test(text)) {
    return { ok: false, reason: "must start with flowchart/graph and direction" };
  }
  const nodeHits = text.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) ?? [];
  // Rough: too many identifiers often means too many nodes — soft check via arrows
  const edges = (text.match(/-->|---|==>/g) ?? []).length;
  if (edges > 20) {
    return { ok: false, reason: "too many edges for one-screen map" };
  }
  if (nodeHits.length > 80) {
    return { ok: false, reason: "diagram too dense" };
  }
  return { ok: true };
}

export function mermaidToArchitectureFile(mermaid: string): string {
  return [
    "# Architecture",
    "",
    "```mermaid",
    mermaid.trim(),
    "```",
    "",
  ].join("\n");
}

export function mermaidTextFallback(mermaidAttempt: string): string {
  return [
    "_Mermaid render failed; textual map:_",
    "",
    "```",
    mermaidAttempt.trim().slice(0, 2000) || "(empty)",
    "```",
  ].join("\n");
}
