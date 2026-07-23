import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLACEHOLDER_RE = /\{\{[a-z_]+\}\}/g;

function packageDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * Resolve default template path (monorepo `templates/readme.md`).
 * Override with DOCWRIGHT_README_TEMPLATE.
 */
export function resolveTemplatePath(): string {
  const fromEnv = process.env.DOCWRIGHT_README_TEMPLATE;
  if (fromEnv) return path.resolve(fromEnv);

  const cwdCandidate = path.resolve(process.cwd(), "templates", "readme.md");
  // packages/core/dist → ../../.. → repo root; packages/core/src → ../.. → packages → need ../../..
  const fromPkg = path.resolve(packageDir(), "..", "..", "..", "templates", "readme.md");
  // When running from src via vitest/tsx, packageDir is .../packages/core/src → ../../../templates
  // When from dist: .../packages/core/dist → ../../../templates (same depth)
  return fromPkg.includes("node_modules") ? cwdCandidate : fromPkg;
}

/** Prefer cwd template if present (monorepo root), else package-relative. */
export async function resolveExistingTemplatePath(): Promise<string> {
  const fromEnv = process.env.DOCWRIGHT_README_TEMPLATE;
  if (fromEnv) return path.resolve(fromEnv);

  const { access } = await import("node:fs/promises");
  const candidates = [
    path.resolve(process.cwd(), "templates", "readme.md"),
    path.resolve(packageDir(), "..", "..", "..", "templates", "readme.md"),
    path.resolve(packageDir(), "..", "..", "templates", "readme.md"),
  ];

  for (const c of candidates) {
    try {
      await access(c);
      return c;
    } catch {
      /* try next */
    }
  }
  return candidates[0];
}

export async function loadReadmeTemplate(
  templatePath?: string,
): Promise<string> {
  const resolved = templatePath ?? (await resolveExistingTemplatePath());
  return readFile(resolved, "utf8");
}

export function listTemplatePlaceholders(template: string): string[] {
  const found = new Set<string>();
  for (const m of template.matchAll(PLACEHOLDER_RE)) {
    found.add(m[0]);
  }
  return [...found].sort();
}

export function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    return `_Not detected from repo._`;
  });
}
