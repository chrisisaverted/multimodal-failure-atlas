import { describe, expect, it } from "vitest";
import { assignHumanStudyBlock } from "@/lib/human-study-assignment";

const blocks = ["block-01", "block-02", "block-03", "block-04"];

describe("human-study block assignment", () => {
  it("honors a valid quota link independently of randomness", () => {
    expect(assignHumanStudyBlock(blocks, "block-03", 0)).toEqual({
      blockId: "block-03",
      assignmentMode: "quota-link",
    });
  });

  it("uses the random value only for an unparameterized demo", () => {
    expect(assignHumanStudyBlock(blocks, null, 6)).toEqual({
      blockId: "block-03",
      assignmentMode: "random-demo",
    });
  });

  it("fails closed for invalid links and malformed manifests", () => {
    expect(() => assignHumanStudyBlock(blocks, "block-09", 0)).toThrow("Unknown study block");
    expect(() => assignHumanStudyBlock([], null, 0)).toThrow("no blocks");
    expect(() => assignHumanStudyBlock(["same", "same"], null, 0)).toThrow("duplicate block IDs");
    expect(() => assignHumanStudyBlock(blocks, null, -1)).toThrow("unsigned 32-bit");
  });
});
