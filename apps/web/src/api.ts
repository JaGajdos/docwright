export type GenerateSuccess = {
  readmeMarkdown: string;
  architectureMermaid: string;
  architectureFallbackText?: string | null;
  warnings?: string[];
};

export type GenerateFailure = {
  error: {
    code: string;
    message: string;
  };
};

function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  return (raw?.replace(/\/$/, "") || "http://localhost:8787").trim();
}

export async function generateDocs(input: {
  repo: string;
  language: string;
}): Promise<GenerateSuccess> {
  const res = await fetch(`${apiBase()}/v1/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      repo: input.repo,
      language: input.language,
    }),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("JSON_PARSE");
  }

  if (!res.ok) {
    const fail = data as GenerateFailure;
    const code = fail?.error?.code ?? "UNKNOWN";
    const message = fail?.error?.message ?? "Request failed";
    const err = new Error(message) as Error & { code: string };
    err.code = code;
    throw err;
  }

  return data as GenerateSuccess;
}
