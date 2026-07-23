/**
 * Extract a short PR summary: title, one-liner, What it is, Quick start.
 */
export function summarizeReadme(fullMarkdown: string): string {
  const lines = fullMarkdown.replace(/\r\n/g, "\n").split("\n");
  const sections: string[] = [];

  let title = "";
  let oneLiner = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("# ") && !title) {
      title = line;
      // next non-empty non-heading as one-liner
      for (let j = i + 1; j < lines.length; j++) {
        const t = lines[j].trim();
        if (!t) continue;
        if (t.startsWith("#")) break;
        oneLiner = t;
        break;
      }
      break;
    }
  }

  if (title) sections.push(title);
  if (oneLiner) sections.push("", oneLiner);

  const extractSection = (heading: string): string | null => {
    const re = new RegExp(`^##\\s+${heading}\\s*$`, "i");
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        start = i;
        break;
      }
    }
    if (start < 0) return null;
    const body: string[] = [lines[start]];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i])) break;
      body.push(lines[i]);
    }
    return body.join("\n").trim();
  };

  for (const name of ["What it is", "Quick start"]) {
    const block = extractSection(name);
    if (block) {
      sections.push("", block);
    }
  }

  const out = sections.join("\n").trim();
  return out || "_No README summary available._";
}
