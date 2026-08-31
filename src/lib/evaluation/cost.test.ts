import { describe, expect, it } from "vitest";
import { assertWithinBudget, BudgetError, configuredRunCap } from "./cost";

describe("evaluation spending guard", () => {
  it("uses a conservative default per-run cap", () => {
    expect(configuredRunCap({})).toBe(25);
  });
  it("rejects a run above the configured cap", () => {
    expect(() => assertWithinBudget(26, 0, {})).toThrow(BudgetError);
  });
  it("preserves the protected project reserve", () => {
    expect(() => assertWithinBudget(20, 885, {})).toThrow(/reserve/);
  });
  it("returns remaining budget for approved runs", () => {
    expect(assertWithinBudget(10, 50, {}).remainingAfterUsd).toBe(940);
  });
});
