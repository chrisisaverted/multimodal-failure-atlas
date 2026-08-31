import { describe, expect, it } from "vitest";
import { getAdapter } from "./registry";

describe("adapter registry", () => {
  it("keeps Gemini disabled until both credentials and dated pricing are configured", () => {
    expect(getAdapter("gemini").availability({ GEMINI_API_KEY: "present" }).available).toBe(false);
  });
  it("reports the missing credential without exposing a value", () => {
    expect(getAdapter("kimi").availability({}).reason).toBe("missing MOONSHOT_API_KEY");
  });
});
