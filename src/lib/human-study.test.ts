import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import admitted from "@/data/admitted-families.json";
import study from "@/data/human-study-manifest.json";

describe("answer-free strict-20 human instrument", () => {
  it("partitions all 320 native cases into eight balanced blocks", () => {
    expect(study.blocks).toHaveLength(8);
    const allCases = study.blocks.flatMap((block) => block.cases);
    expect(allCases).toHaveLength(320);
    expect(new Set(allCases.map((candidate) => candidate.studyCaseId)).size).toBe(320);

    for (const block of study.blocks) {
      expect(block.cases).toHaveLength(40);
      const familyCounts = new Map<string, number>();
      for (const candidate of block.cases)
        familyCounts.set(candidate.catalogueId, (familyCounts.get(candidate.catalogueId) ?? 0) + 1);
      expect(familyCounts.size).toBe(20);
      expect([...familyCounts.values()].every((count) => count === 2)).toBe(true);
    }
  });

  it("contains every admitted family and equal image/video representation", () => {
    const allCases = study.blocks.flatMap((block) => block.cases);
    expect(new Set(allCases.map((candidate) => candidate.catalogueId))).toEqual(
      new Set(admitted.families.map((family) => family.catalogueId)),
    );
    expect(allCases.filter((candidate) => candidate.modality === "image")).toHaveLength(160);
    expect(allCases.filter((candidate) => candidate.modality === "video")).toHaveLength(160);
  });

  it("ships no constructed answers and binds to existing media", () => {
    const allCases = study.blocks.flatMap((block) => block.cases);
    for (const candidate of allCases) {
      expect(candidate).not.toHaveProperty("expectedAnswer");
      expect(candidate).not.toHaveProperty("correct");
      expect(candidate.mediaSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(existsSync(resolve(`public${candidate.artifactPath}`))).toBe(true);
    }
  });
});
