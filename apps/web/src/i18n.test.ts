import { describe, expect, it } from "vitest";
import { normalizeLocale, t } from "./i18n.js";

describe("i18n", () => {
  it("normalizes locale codes", () => {
    expect(normalizeLocale("sk")).toBe("sk");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("de")).toBe("en");
  });

  it("returns localized labels", () => {
    expect(t("generate", "sk")).toBe("Generovať");
    expect(t("generate", "en")).toBe("Generate");
    expect(t("loaderTitle", "sk")).toMatch(/Generujem/);
  });
});
