import { describe, expect, it } from "vitest";
import { auditUniqueSpend, type SpendRecord } from "@/lib/evaluation/spend-audit";

const records: SpendRecord[] = [
  {
    id: "one",
    requestId: "request-one",
    provider: "gateway",
    modelId: "model-a",
    costUsd: 1.25,
    costBasis: "reported",
  },
  {
    id: "two",
    requestId: "request-two",
    provider: "gateway",
    modelId: "model-b",
    costUsd: 2.5,
    costBasis: "estimated",
  },
];

describe("global experiment spend audit", () => {
  it("deduplicates identical request IDs and groups the unique spend", () => {
    const audit = auditUniqueSpend([...records, { ...records[0]! }], 10);
    expect(audit).toMatchObject({
      sourceRecords: 3,
      uniqueRequests: 2,
      duplicateRecords: 1,
      costUsd: 3.75,
      budgetUsd: 10,
      remainingUsd: 6.25,
    });
    expect(audit.byProvider).toEqual([{ key: "gateway", requests: 2, costUsd: 3.75 }]);
    expect(audit.byModel).toEqual([
      { key: "model-b", requests: 1, costUsd: 2.5 },
      { key: "model-a", requests: 1, costUsd: 1.25 },
    ]);
  });

  it("counts distinct provider requests even when their logical evaluation ID collides", () => {
    const retry = { ...records[0]!, requestId: "request-retry", costUsd: 0.75 };
    const audit = auditUniqueSpend([...records, retry], 10);
    expect(audit.uniqueRequests).toBe(3);
    expect(audit.costUsd).toBe(4.5);
  });

  it("rejects inconsistent duplicate provider request IDs instead of hiding cost drift", () => {
    expect(() => auditUniqueSpend([...records, { ...records[0]!, costUsd: 9 }], 20)).toThrow(
      "conflicting duplicate provider request",
    );
  });

  it("fails when recorded spend exceeds the declared ceiling", () => {
    expect(() => auditUniqueSpend(records, 3)).toThrow("exceeds $3.00 budget");
  });
});
