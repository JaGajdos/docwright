import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  AgentLimitError,
  generateDocs,
  usesAzureOpenAI,
  usesResponsesApi,
  resolveLlmModel,
  type GenerateDocsInput,
  type GenerateDocsOutput,
} from "@docwright/core";
import { apiError, mapGenerateError } from "./errors.js";
import { IpRateLimiter, rateLimitFromEnv } from "./rateLimit.js";

function isDebug(): boolean {
  const v = process.env.DOCWRIGHT_DEBUG?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type GenerateFn = (
  input: GenerateDocsInput,
) => Promise<GenerateDocsOutput>;

export type AppDeps = {
  generate?: GenerateFn;
  rateLimiter?: IpRateLimiter;
  apiKey?: string | null;
  requestTimeoutMs?: number;
};

function parseCorsOrigins(): string[] | "*" {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === "*") return "*";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function clientIp(c: {
  req: { header: (name: string) => string | undefined };
}): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return c.req.header("x-real-ip") || "unknown";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error(`Request timed out after ${ms}ms`);
      (err as Error & { code?: string }).code = "TIMEOUT";
      reject(err);
    }, ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export function createApp(deps: AppDeps = {}) {
  const app = new Hono();
  const origins = parseCorsOrigins();
  const limiter = deps.rateLimiter ?? new IpRateLimiter(rateLimitFromEnv());
  const generate = deps.generate ?? generateDocs;
  const configuredKey = deps.apiKey ?? process.env.DOCWRIGHT_API_KEY ?? null;
  const timeoutMs =
    deps.requestTimeoutMs ??
    Number.parseInt(process.env.DOCWRIGHT_REQUEST_TIMEOUT_MS ?? "120000", 10);

  app.use(
    "*",
    cors({
      origin: origins === "*" ? "*" : origins,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/", (c) =>
    c.json({
      name: "docwright-api",
      version: "0.1.0",
      endpoints: ["POST /v1/generate", "GET /v1/debug/config"],
    }),
  );

  /** Non-secret runtime config — useful to verify Railway env without keys. */
  app.get("/v1/debug/config", (c) =>
    c.json({
      debug: isDebug(),
      llmApi: usesResponsesApi() ? "responses" : "chat",
      azure: usesAzureOpenAI(),
      model: resolveLlmModel(),
      azureEndpointSet: Boolean(process.env.AZURE_OPENAI_ENDPOINT?.trim()),
      azureApiVersion:
        process.env.AZURE_OPENAI_API_VERSION?.trim() || "2025-04-01-preview",
      mcpProvider: process.env.DOCWRIGHT_MCP_PROVIDER?.trim() || "github",
      mcpCommand: process.env.DOCWRIGHT_MCP_COMMAND?.trim() || "(default)",
      githubToolsets: process.env.GITHUB_TOOLSETS?.trim() || "(default in code)",
      rateLimitPerHour: process.env.DOCWRIGHT_RATE_LIMIT_PER_HOUR ?? "5",
      timeoutMs: process.env.DOCWRIGHT_REQUEST_TIMEOUT_MS ?? "120000",
    }),
  );

  app.post("/v1/generate", async (c) => {
    const auth = c.req.header("authorization");
    if (auth) {
      const match = /^Bearer\s+(.+)$/i.exec(auth);
      if (!configuredKey || !match || match[1] !== configuredKey) {
        return c.json(apiError("UNAUTHORIZED", "Invalid or missing API key."), 401);
      }
    }

    const ip = clientIp(c);
    const rl = limiter.check(ip);
    if (!rl.allowed) {
      c.header("Retry-After", String(rl.retryAfterSec));
      return c.json(
        apiError(
          "RATE_LIMITED",
          "Too many requests. Please try again later.",
        ),
        429,
      );
    }

    let body: {
      repo?: string;
      ref?: string;
      language?: string;
      limits?: GenerateDocsInput["limits"];
      sha?: string;
      mcpProvider?: string;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json(apiError("INVALID_REPO", "Request body must be JSON."), 400);
    }

    if (!body.repo || typeof body.repo !== "string") {
      return c.json(
        apiError("INVALID_REPO", "Field 'repo' is required (owner/repo or URL)."),
        400,
      );
    }

    try {
      console.error(
        `[docwright] POST /v1/generate start repo=${body.repo} debug=${isDebug()}`,
      );
      const result = await withTimeout(
        generate({
          repo: body.repo,
          ref: body.ref,
          language: body.language,
          limits: body.limits,
          sha: body.sha,
          mcpProvider: body.mcpProvider,
        }),
        timeoutMs,
      );
      console.error(`[docwright] POST /v1/generate ok repo=${body.repo}`);

      return c.json({
        repo: body.repo,
        ref: body.ref ?? null,
        sha: body.sha ?? null,
        readmeMarkdown: result.readmeMarkdown,
        architectureMermaid: result.architectureMermaid,
        architectureMarkdownFile: result.architectureMarkdownFile,
        architectureFallbackText: result.architectureFallbackText ?? null,
        warnings: result.warnings,
        prCommentMarkdown: result.prCommentMarkdown,
      });
    } catch (err) {
      const e = err as Error & { code?: string };
      console.error(
        `[docwright] POST /v1/generate FAIL repo=${body.repo}`,
        e.code ?? "",
        e.message ?? err,
      );
      if (e.stack) console.error(e.stack);

      const code = e.code;
      if (err instanceof AgentLimitError || code === "AGENT_LIMIT") {
        const bodyErr = apiError(
          "AGENT_LIMIT",
          err instanceof Error ? err.message : "Agent limit exceeded",
        );
        if (isDebug()) {
          return c.json({ ...bodyErr, debug: { stack: e.stack } }, 502);
        }
        return c.json(bodyErr, 502);
      }
      const mapped = mapGenerateError(err);
      if (isDebug()) {
        return c.json(
          {
            ...mapped.body,
            debug: {
              name: e.name,
              stack: e.stack,
            },
          },
          mapped.status as 400 | 404 | 502 | 504,
        );
      }
      return c.json(mapped.body, mapped.status as 400 | 404 | 502 | 504);
    }
  });

  return { app, limiter };
}
