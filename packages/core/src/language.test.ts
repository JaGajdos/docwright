import { describe, expect, it } from "vitest";
import { resolveOutputLanguage } from "./language.js";

describe("resolveOutputLanguage", () => {
  it("maps sk to Slovak label", () => {
    const lang = resolveOutputLanguage("sk");
    expect(lang.code).toBe("sk");
    expect(lang.label).toMatch(/Slovak/);
    expect(lang.notDetected).toMatch(/nezistené/);
  });

  it("defaults to English", () => {
    const lang = resolveOutputLanguage(undefined);
    expect(lang.code).toBe("en");
    expect(lang.label).toBe("English");
  });
});
