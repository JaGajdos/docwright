import { describe, expect, it } from "vitest";
import { setGenerateLoading } from "./loading.js";

describe("setGenerateLoading", () => {
  it("disables Generate button and shows loader while loading", () => {
    const submit = { disabled: false };
    const status = { hidden: true, textContent: "" };
    const loader = { hidden: true };

    setGenerateLoading(submit, status, true, undefined, loader);
    expect(submit.disabled).toBe(true);
    expect(loader.hidden).toBe(false);
    expect(status.hidden).toBe(false);
    expect(status.textContent).toMatch(/Generating/);

    setGenerateLoading(submit, status, false, undefined, loader);
    expect(submit.disabled).toBe(false);
    expect(loader.hidden).toBe(true);
  });
});
