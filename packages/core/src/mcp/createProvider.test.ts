import { afterEach, describe, expect, it } from "vitest";
import {
  createMcpProvider,
  listMcpProviders,
  registerMcpProvider,
  resolveMcpProvider,
  unregisterMcpProvider,
} from "./createProvider.js";
import { extractRepoHost } from "./repoHost.js";
import { resolveMcpLaunchConfig } from "./githubProvider.js";
import type { McpProvider } from "./providerTypes.js";

describe("extractRepoHost", () => {
  it("maps owner/repo to github.com", () => {
    expect(extractRepoHost("sindresorhus/is")).toBe("github.com");
  });

  it("parses github URLs", () => {
    expect(extractRepoHost("https://github.com/a/b")).toBe("github.com");
    expect(extractRepoHost("https://www.github.com/a/b")).toBe("github.com");
  });

  it("parses other hosts for future providers", () => {
    expect(extractRepoHost("https://gitlab.com/group/proj")).toBe("gitlab.com");
  });
});

describe("resolveMcpProvider by URL", () => {
  afterEach(() => {
    // leave github registered (builtin); remove any test stubs
    unregisterMcpProvider("stub-gitlab");
  });

  it("selects github for github.com URLs", () => {
    const p = resolveMcpProvider({
      repoUrl: "https://github.com/JaGajdos/docwright",
    });
    expect(p.id).toBe("github");
  });

  it("selects github for owner/repo shorthand", () => {
    expect(resolveMcpProvider({ repoUrl: "owner/repo" }).id).toBe("github");
  });

  it("fails for unregistered host", () => {
    expect(() =>
      resolveMcpProvider({ repoUrl: "https://gitlab.com/a/b" }),
    ).toThrow(/No MCP provider registered for host "gitlab.com"/);
  });

  it("uses a newly registered provider for its host", () => {
    const stub: McpProvider = {
      id: "stub-gitlab",
      tools: ["get_repository_tree", "get_file_contents"],
      hosts: ["gitlab.com"],
      async createSession() {
        return {
          async callTool() {
            return { text: "ok" };
          },
          async close() {},
        };
      },
    };
    registerMcpProvider(stub);
    expect(
      resolveMcpProvider({ repoUrl: "https://gitlab.com/group/proj" }).id,
    ).toBe("stub-gitlab");
  });

  it("explicit providerId wins over URL", () => {
    const p = resolveMcpProvider({
      providerId: "github",
      repoUrl: "https://gitlab.com/a/b",
    });
    expect(p.id).toBe("github");
  });

  it("lists registered providers including github", () => {
    expect(listMcpProviders().some((p) => p.id === "github")).toBe(true);
  });
});

describe("createMcpProvider", () => {
  it("defaults to github", () => {
    const prev = process.env.DOCWRIGHT_MCP_PROVIDER;
    delete process.env.DOCWRIGHT_MCP_PROVIDER;
    const p = createMcpProvider();
    expect(p.id).toBe("github");
    process.env.DOCWRIGHT_MCP_PROVIDER = prev;
  });

  it("rejects unknown provider id", () => {
    expect(() => createMcpProvider({ providerId: "nope" })).toThrow(
      /Unknown MCP provider/,
    );
  });
});

describe("resolveMcpLaunchConfig", () => {
  it("defaults to docker github-mcp-server", () => {
    const prevCmd = process.env.DOCWRIGHT_MCP_COMMAND;
    const prevArgs = process.env.DOCWRIGHT_MCP_ARGS;
    delete process.env.DOCWRIGHT_MCP_COMMAND;
    delete process.env.DOCWRIGHT_MCP_ARGS;
    const cfg = resolveMcpLaunchConfig("tok");
    expect(cfg.command).toBe("docker");
    expect(cfg.args).toContain("ghcr.io/github/github-mcp-server");
    process.env.DOCWRIGHT_MCP_COMMAND = prevCmd;
    process.env.DOCWRIGHT_MCP_ARGS = prevArgs;
  });

  it("uses binary + stdio when DOCWRIGHT_MCP_COMMAND set", () => {
    process.env.DOCWRIGHT_MCP_COMMAND = "/usr/local/bin/github-mcp-server";
    delete process.env.DOCWRIGHT_MCP_ARGS;
    const cfg = resolveMcpLaunchConfig("tok");
    expect(cfg.command).toBe("/usr/local/bin/github-mcp-server");
    expect(cfg.args).toEqual(["stdio"]);
    delete process.env.DOCWRIGHT_MCP_COMMAND;
  });
});
