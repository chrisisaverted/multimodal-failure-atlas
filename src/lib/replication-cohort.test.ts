import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import cohort from "../../evaluation/plans/external-replication-cohort-v1.json";
import { externalReplication } from "@/lib/external-replication";

describe("frozen external replication cohort", () => {
  it("binds exactly the original ten image and ten video families", () => {
    expect(cohort.families).toHaveLength(20);
    expect(cohort.families.filter((family) => family.modality === "image")).toHaveLength(10);
    expect(cohort.families.filter((family) => family.modality === "video")).toHaveLength(10);
    expect(new Set(cohort.families.map((family) => family.planId)).size).toBe(20);
    expect(cohort.families.map((family) => family.planId)).toContain("pair-collision-confirmatory-v1");
    expect(cohort.families.map((family) => family.planId)).toContain("grid-activation-confirmatory-v3");
    expect(cohort.families.map((family) => family.planId)).not.toContain(
      "pair-collision-gated-confirmatory-v1",
    );
  });

  it("matches every frozen media manifest and the published replication summary", () => {
    expect(new Set(externalReplication.families.map((family) => family.planId))).toEqual(
      new Set(cohort.families.map((family) => family.planId)),
    );
    for (const family of cohort.families) {
      const manifest = JSON.parse(
        readFileSync(resolve(`public/evaluations/${family.planId}/manifest.json`), "utf8"),
      ) as { planSha256: string };
      expect(manifest.planSha256, family.planId).toBe(family.planSha256);
    }
  });
});
