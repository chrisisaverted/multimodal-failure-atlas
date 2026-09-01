import { describe, expect, it } from "vitest";
import { replicationStatus, type ReplicationFamily } from "./external-replication";

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
});
