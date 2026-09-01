import { describe, expect, it } from "vitest";
import { adjudicateExplicitDeclaration } from "./adjudication";

describe("answer-key-blind explicit declaration adjudication", () => {
  it("recognizes an explicitly named panel despite later option mentions", () => {
    expect(
      adjudicateExplicitDeclaration(
        "Based on the image, the correct panel is **B**. Panels A, C, and D are blocked.",
        ["A", "B", "C", "D"],
      ),
    ).toEqual({ claimedAnswer: "B", basis: "explicit-declaration", withinOptions: true });
  });

  it("recognizes a multiword location", () => {
    expect(
      adjudicateExplicitDeclaration("The rotated glyph is located in the top-right quadrant.", [
        "top-left quadrant",
        "top-right quadrant",
        "bottom-left quadrant",
        "bottom-right quadrant",
      ])?.claimedAnswer,
    ).toBe("top-right quadrant");
  });

  it("treats an explicit outside-set answer as substantive without knowing correctness", () => {
    expect(
      adjudicateExplicitDeclaration("There are exactly **8** closed boundaries.", ["9", "10", "11", "12"]),
    ).toEqual({
      claimedAnswer: "8",
      basis: "explicit-declaration",
      withinOptions: false,
    });
    expect(adjudicateExplicitDeclaration("Analysis follows.\n\n**6**", ["9", "10", "11", "12"])).toEqual({
      claimedAnswer: "6",
      basis: "terminal-standalone",
      withinOptions: false,
    });
  });

  it("leaves hedged and conflicting declarations unresolved", () => {
    expect(
      adjudicateExplicitDeclaration("The answer is either A or B.", ["A", "B", "C", "D"]),
    ).toBeUndefined();
    expect(
      adjudicateExplicitDeclaration("The correct panel is A. On reflection, the final answer is C.", [
        "A",
        "B",
        "C",
        "D",
      ]),
    ).toBeUndefined();
  });
});
