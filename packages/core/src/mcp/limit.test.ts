import { describe, expect, it } from "vitest";
import type { GithubMcpSession } from "../mcp/types.js";
import { withFileReadLimit } from "../mcp/types.js";
import { getLimits } from "../limits.js";

describe("withFileReadLimit", () => {
  it("blocks get_file_contents after max", async () => {
    const calls: string[] = [];
    const base: GithubMcpSession = {
      async callTool(name) {
        calls.push(name);
        return { text: "ok" };
      },
      async close() {},
    };
    const limited = withFileReadLimit(base, getLimits({ maxFilesRead: 2 }));
    await limited.callTool("get_file_contents", { path: "a" });
    await limited.callTool("get_file_contents", { path: "b" });
    const blocked = await limited.callTool("get_file_contents", { path: "c" });
    expect(blocked.isError).toBe(true);
    expect(blocked.text).toContain("FILE_READ_LIMIT");
    expect(calls.filter((c) => c === "get_file_contents")).toHaveLength(2);
    expect(limited.getFilesReadCount()).toBe(2);
  });

  it("does not count tree calls", async () => {
    const base: GithubMcpSession = {
      async callTool() {
        return { text: "tree" };
      },
      async close() {},
    };
    const limited = withFileReadLimit(base, getLimits({ maxFilesRead: 1 }));
    await limited.callTool("get_repository_tree", {});
    await limited.callTool("get_repository_tree", {});
    expect(limited.getFilesReadCount()).toBe(0);
  });
});
