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

  it("respects DOCWRIGHT_MCP_COMMAND override", () => {
    process.env.DOCWRIGHT_MCP_COMMAND = "github-mcp-server";
    process.env.DOCWRIGHT_MCP_ARGS = "[]";
    const cfg = resolveMcpLaunchConfig("tok");
    expect(cfg.command).toBe("github-mcp-server");
    expect(cfg.args).toEqual([]);
    delete process.env.DOCWRIGHT_MCP_COMMAND;
    delete process.env.DOCWRIGHT_MCP_ARGS;
  });
});
