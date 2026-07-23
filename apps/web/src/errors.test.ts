import { describe, expect, it } from "vitest";
import { userMessageForError } from "./errors.js";

describe("userMessageForError", () => {
  it("maps known codes in Slovak", () => {
    const err = new Error("x") as Error & { code: string };
    err.code = "RATE_LIMITED";
    expect(userMessageForError(err, "sk")).toContain("Príliš veľa");
  });

  it("maps INVALID_REPO in English", () => {
    const err = new Error("x") as Error & { code: string };
    err.code = "INVALID_REPO";
    expect(userMessageForError(err, "en")).toContain("Check the repo");
  });
});
