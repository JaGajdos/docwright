export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function apiError(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

export function mapGenerateError(err: unknown): {
  status: number;
  body: ApiErrorBody;
} {
  const e = err as Error & { code?: string; status?: number };
  const code = e.code ?? "INTERNAL_ERROR";
  const message = e.message || "Unexpected error";

  if (code === "INVALID_REPO") {
    return { status: 400, body: apiError("INVALID_REPO", message) };
  }
  if (code === "AGENT_LIMIT") {
    return { status: 502, body: apiError("AGENT_LIMIT", message) };
  }
  if (code === "REPO_INACCESSIBLE" || /not found|404|inaccessible|private/i.test(message)) {
    return {
      status: 404,
      body: apiError("REPO_INACCESSIBLE", message),
    };
  }
  if (/timeout|aborted/i.test(message)) {
    return { status: 504, body: apiError("TIMEOUT", message) };
  }
  if (/OPENAI|LLM|rate_limit|api key|Azure/i.test(message)) {
    return { status: 502, body: apiError("LLM_UNAVAILABLE", message) };
  }
  if (/MCP|github-mcp|GITHUB_TOKEN/i.test(message)) {
    return { status: 502, body: apiError("MCP_UNAVAILABLE", message) };
  }
  return { status: 502, body: apiError("LLM_UNAVAILABLE", message) };
}
