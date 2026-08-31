import { describe, expect, it } from "vitest";
import { scoreExactOption } from "./scorer";

describe("exact option scorer", () => {
  it("accepts an exact option independent of case and punctuation", () => {
    expect(scoreExactOption("YES.", "yes", ["yes", "no"])).toMatchObject({
      parsedAnswer: "yes",
      correct: true,
      needsReview: false,
    });
  });

  it("extracts one unambiguous option from a short response", () => {
    expect(scoreExactOption("The answer is square.", "circle", ["circle", "square"])).toMatchObject({
      parsedAnswer: "square",
      correct: false,
      needsReview: false,
    });
  });

  it("routes ambiguous and unparseable responses to review", () => {
    expect(scoreExactOption("It could be yes or no.", "yes", ["yes", "no"]).needsReview).toBe(true);
    expect(scoreExactOption("unclear", "yes", ["yes", "no"]).needsReview).toBe(true);
  });
});
