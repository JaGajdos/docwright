import { describe, expect, it } from "vitest";
import { resolveMcpLaunchConfig } from "./session.js";

describe("resolveMcpLaunchConfig", () => {
  it("defaults to docker official image", () => {
    const prevCmd = process.env.DOCWRIGHT_MCP_COMMAND;
    const prevArgs = process.env.DOCWRIGHT_MCP_ARGS;
    delete process.env.DOCWRIGHT_MCP_COMMAND;
    delete process.env.DOCWRIGHT_MCP_ARGS;
    const cfg = resolveMcpLaunchConfig("tok");
    expect(cfg.command).toBe("docker");
    expect(cfg.args).toContain("ghcr.io/github/github-mcp-server");
    expect(cfg.env?.GITHUB_PERSONAL_ACCESS_TOKEN).toBe("tok");
    process.env.DOCWRIGHT_MCP_COMMAND = prevCmd;
    process.env.DOCWRIGHT_MCP_ARGS = prevArgs;
  });

  it("defaults github-mcp-server binary to stdio args", () => {
    process.env.DOCWRIGHT_MCP_COMMAND = "/usr/local/bin/github-mcp-server";
    delete process.env.DOCWRIGHT_MCP_ARGS;
    const cfg = resolveMcpLaunchConfig("tok");
    expect(cfg.args).toEqual(["stdio"]);
    expect(cfg.env?.GITHUB_TOOLSETS).toBe("repos,git");
    expect(cfg.env?.GITHUB_TOOLS).toContain("get_repository_tree");
    delete process.env.DOCWRIGHT_MCP_COMMAND;
  });
});
