/**
 * Railway-friendly debug logging.
 * Enable with DOCWRIGHT_DEBUG=1 (or true).
 * Errors are always logged to stderr regardless.
 */

export function isDebugEnabled(): boolean {
  const v = process.env.DOCWRIGHT_DEBUG?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function debugLog(scope: string, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;
  const ts = new Date().toISOString();
  if (data !== undefined) {
    let payload: string;
    try {
      payload = JSON.stringify(data, null, 0);
      if (payload.length > 4000) payload = payload.slice(0, 4000) + "…";
    } catch {
      payload = String(data);
    }
    console.error(`[docwright ${ts}] [${scope}] ${message} ${payload}`);
  } else {
    console.error(`[docwright ${ts}] [${scope}] ${message}`);
  }
}

export function errorLog(scope: string, err: unknown, extra?: unknown): void {
  const ts = new Date().toISOString();
  const e = err as Error & { code?: string; status?: number };
  console.error(
    `[docwright ${ts}] [${scope}] ERROR`,
    e?.code ?? "",
    e?.message ?? String(err),
  );
  if (e?.stack) console.error(e.stack);
  if (extra !== undefined) {
    try {
      console.error(`[docwright ${ts}] [${scope}] context`, JSON.stringify(extra));
    } catch {
      console.error(`[docwright ${ts}] [${scope}] context`, extra);
    }
  }
}
