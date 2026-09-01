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

  it("does not treat arbitrary words as outside numeric or letter answers", () => {
    expect(adjudicateExplicitDeclaration("The answer is frame by frame.", ["3", "4", "5", "6"])).toBeUndefined();
    expect(adjudicateExplicitDeclaration("The final answer is unknown-token.", ["A", "B", "C", "D"])).toBeUndefined();
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

  it("uses a clearly terminal answer label instead of intermediate running counts", () => {
    expect(
      adjudicateExplicitDeclaration(
        "Collision one. Count: 1.\nCollision two. Count: 2.\n\n**Answer:** 10",
        ["5", "6", "7", "8"],
      ),
    ).toEqual({
      claimedAnswer: "10",
      basis: "terminal-standalone",
      withinOptions: false,
    });
  });

  it("recovers a recent bold numeric conclusion followed by supporting cell labels", () => {
    expect(
      adjudicateExplicitDeclaration(
        "Frame audit.\n\n**5** cells flashed exactly twice.\n\nThose cells are: **A1, D4, E1, E3, E5**",
        ["3", "4", "5", "6"],
      ),
    ).toEqual({ claimedAnswer: "5", basis: "terminal-standalone", withinOptions: true });
  });

  it("uses the leading marked answer before a parenthetical option recap", () => {
    expect(
      adjudicateExplicitDeclaration("**Correct Answer:** **3** (options: **3**, **4**, **5**, **6**)", [
        "3",
        "4",
        "5",
        "6",
      ]),
    ).toEqual({ claimedAnswer: "3", basis: "terminal-standalone", withinOptions: true });
  });
});
