import { describe, expect, it } from "vitest";
import { externalReplication, replicationStatus, type ReplicationFamily } from "./external-replication";

const family = (complete: boolean, replicatedBelowHalf: boolean) =>
  ({ complete, replicatedBelowHalf }) as ReplicationFamily;

describe("external replication status", () => {
  it("never calls an incomplete family replicated", () => {
    expect(replicationStatus(family(false, true))).toBe("incomplete");
  });

  it("separates completed positive and negative replications", () => {
    expect(replicationStatus(family(true, true))).toBe("replicated");
    expect(replicationStatus(family(true, false))).toBe("did-not-replicate");
  });

  it("publishes complete answer distributions for every substantive condition", () => {
    for (const family of externalReplication.families) {
      for (const model of family.models) {
        for (const condition of [model.native, model.control]) {
          expect(
            Object.values(condition.answerDistribution ?? {}).reduce((sum, count) => sum + count, 0),
            `${family.planId}:${model.modelId}:${condition.condition}`,
          ).toBe(condition.substantiveAnswers);
        }
      }
    }
  });
});
