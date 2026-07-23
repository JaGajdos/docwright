import { describe, expect, it } from "vitest";
import { userMessageForError } from "./errors.js";

describe("userMessageForError", () => {
  it("maps known codes", () => {
    const err = new Error("x") as Error & { code: string };
    err.code = "RATE_LIMITED";
    expect(userMessageForError(err)).toContain("Príliš veľa");
  });

  it("maps INVALID_REPO", () => {
    const err = new Error("x") as Error & { code: string };
    err.code = "INVALID_REPO";
    expect(userMessageForError(err)).toContain("Skontroluj");
  });
});
