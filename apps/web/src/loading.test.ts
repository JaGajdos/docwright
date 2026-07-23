import { describe, expect, it } from "vitest";
import { setGenerateLoading } from "./loading.js";

describe("setGenerateLoading", () => {
  it("disables Generate button while loading", () => {
    const submit = { disabled: false };
    const status = { hidden: true, textContent: "" };

    setGenerateLoading(submit, status, true);
    expect(submit.disabled).toBe(true);
    expect(status.hidden).toBe(false);
    expect(status.textContent).toMatch(/Generating/);

    setGenerateLoading(submit, status, false);
    expect(submit.disabled).toBe(false);
  });
});
