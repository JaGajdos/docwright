import { describe, expect, it } from "vitest";
import {
  fillTemplate,
  listTemplatePlaceholders,
  loadReadmeTemplate,
  resolveExistingTemplatePath,
} from "./template.js";

describe("template", () => {
  it("loads default readme template with placeholders", async () => {
    const path = await resolveExistingTemplatePath();
    expect(path.replace(/\\/g, "/")).toMatch(/templates\/readme\.md$/);
    const tpl = await loadReadmeTemplate(path);
    const placeholders = listTemplatePlaceholders(tpl);
    expect(placeholders).toContain("{{project_name}}");
    expect(placeholders).toContain("{{architecture_map}}");
    expect(placeholders).toContain("{{quick_start}}");
  });

  it("fills known placeholders", () => {
    const out = fillTemplate("# {{project_name}}\n{{missing}}", {
      project_name: "Docwright",
    });
    expect(out).toContain("Docwright");
    expect(out).toContain("_Not detected from repo._");
  });
});
