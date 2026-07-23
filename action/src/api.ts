export type GenerateApiResult = {
  prCommentMarkdown: string;
  readmeMarkdown?: string;
  architectureMermaid?: string;
  warnings?: string[];
};

export async function callGenerateApi(input: {
  apiUrl: string;
  apiKey: string;
  owner: string;
  repo: string;
  ref: string;
  sha: string;
  fetchImpl?: typeof fetch;
}): Promise<GenerateApiResult> {
  const base = input.apiUrl.replace(/\/$/, "");
  const fetchFn = input.fetchImpl ?? fetch;

  const res = await fetchFn(`${base}/v1/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      repo: `${input.owner}/${input.repo}`,
      ref: input.ref,
      sha: input.sha,
      language: "en",
    }),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Docwright API returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const err = data as { error?: { code?: string; message?: string } };
    const code = err?.error?.code ?? "UNKNOWN";
    const message = err?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Docwright API ${code}: ${message}`);
  }

  const ok = data as GenerateApiResult;
  if (!ok.prCommentMarkdown || typeof ok.prCommentMarkdown !== "string") {
    throw new Error("Docwright API response missing prCommentMarkdown");
  }
  return ok;
}
