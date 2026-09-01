import { describe, expect, it } from "vitest";
import { scoreExactOption, scoreTerminalOption, scoreTerminalOptionV3 } from "./scorer";

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

describe("terminal option scorer v2", () => {
  it("uses a clearly marked terminal answer even when analysis mentions alternatives", () => {
    expect(
      scoreTerminalOption("I considered circle and square.\nFinal answer: square", "square", [
        "circle",
        "square",
      ]),
    ).toMatchObject({
      parsedAnswer: "square",
      correct: true,
      needsReview: false,
      method: "terminal-option-v2",
    });
  });

  it("uses an exact final line but leaves genuinely ambiguous output for review", () => {
    expect(scoreTerminalOption("Maybe 3, but after recounting:\n5", "5", ["3", "5"]).correct).toBe(true);
    expect(scoreTerminalOption("Either 3 or 5", "5", ["3", "5"]).needsReview).toBe(true);
  });

  it("uses a markdown-wrapped correct-answer marker", () => {
    expect(
      scoreTerminalOption("Reasoning mentions A and C.\n**Correct Answer:** **B**", "B", [
        "A",
        "B",
        "C",
        "D",
      ]),
    ).toMatchObject({
      parsedAnswer: "B",
      correct: true,
      needsReview: false,
      method: "terminal-option-v2",
    });
  });
});

describe("terminal option scorer v3", () => {
  it("accepts one allowed option in a terminal answer sentence", () => {
    expect(
      scoreTerminalOptionV3(
        "I considered STAR and CIRCLE.\nThe symbol immediately after it is **DIAMOND**.",
        "DIAMOND",
        ["STAR", "CIRCLE", "DIAMOND", "SQUARE"],
      ),
    ).toEqual({
      parsedAnswer: "DIAMOND",
      correct: true,
      needsReview: false,
      method: "terminal-option-v3",
    });
  });

  it("leaves an ambiguous terminal sentence pending", () => {
    expect(
      scoreTerminalOptionV3("The answer is either STAR or CIRCLE.", "STAR", ["STAR", "CIRCLE"]),
    ).toMatchObject({ parsedAnswer: "", correct: false, needsReview: true });
  });
});
