import { describe, expect, it } from "vitest";
import {
  fillAgentPlaceholders,
  loadAgentConfig,
} from "./agentConfig.js";
import { getLimits } from "./limits.js";
import {
  buildFinalInstruction,
  buildSystemPrompt,
  buildUserPrompt,
} from "./agent/prompts.js";

describe("agentConfig", () => {
  it("loads repo config/agent.json and prompt markdown", async () => {
    const cfg = await loadAgentConfig();
    expect(cfg.configPath.replace(/\\/g, "/")).toMatch(/config\/agent\.json$/);
    expect(cfg.prompts.system).toMatch(/Docwright/);
    expect(cfg.prompts.user).toMatch(/\{\{owner\}\}/);
    expect(cfg.prompts.final).toMatch(/STOP calling tools/);
    expect(cfg.limits.maxFilesRead).toBe(8);
  });

  it("fills only known placeholders", () => {
    const out = fillAgentPlaceholders(
      "Hello {{owner}} keep {{architecture_map}}",
      { owner: "acme" },
    );
    expect(out).toBe("Hello acme keep {{architecture_map}}");
  });

  it("builds prompts from templates", () => {
    const system = buildSystemPrompt("sk", 10, "Lang={{language}} nodes={{max_architecture_nodes}}");
    expect(system).toBe("Lang=sk nodes=10");

    const user = buildUserPrompt(
      { owner: "o", repo: "r", template: "# T {{project_name}}" },
      "Repo {{owner}}/{{repo}} ({{ref_line}})\n{{template}}",
    );
    expect(user).toContain("Repo o/r (ref: (default branch))");
    expect(user).toContain("# T {{project_name}}");

    expect(buildFinalInstruction("  STOP  ")).toBe("STOP");
  });

  it("merges file limits under env/overrides", () => {
    const limits = getLimits({ maxFilesRead: 2 }, { maxFilesRead: 99, maxToolRounds: 4 });
    expect(limits.maxFilesRead).toBe(2);
    expect(limits.maxToolRounds).toBe(4);
    expect(limits.maxToolResultChars).toBe(12_000);
  });
});
