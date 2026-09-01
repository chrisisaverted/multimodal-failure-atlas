export interface SpendRecord {
  id: string;
  requestId?: string;
  sourceRecordKey?: string;
  provider: string;
  modelId: string;
  costUsd: number;
  costBasis?: string;
}

function increment(group: Map<string, { requests: number; costUsd: number }>, key: string, costUsd: number) {
  const current = group.get(key) ?? { requests: 0, costUsd: 0 };
  group.set(key, { requests: current.requests + 1, costUsd: current.costUsd + costUsd });
}

export function auditUniqueSpend(records: SpendRecord[], budgetUsd: number) {
  if (!Number.isFinite(budgetUsd) || budgetUsd <= 0) throw new Error("Experiment budget must be positive");
  const unique = new Map<string, SpendRecord>();
  let duplicateRecords = 0;
  for (const record of records) {
    if (!record.id) throw new Error("Spend record is missing an ID");
    if (!Number.isFinite(record.costUsd) || record.costUsd < 0)
      throw new Error(`${record.id}: invalid recorded cost`);
    const requestIdentity = record.requestId
      ? `provider:${record.requestId}`
      : record.sourceRecordKey
        ? `source:${record.sourceRecordKey}`
        : undefined;
    if (!requestIdentity)
      throw new Error(`${record.id}: spend audit requires a provider request ID or source record key`);
    const existing = unique.get(requestIdentity);
    if (existing) {
      duplicateRecords += 1;
      if (
        existing.provider !== record.provider ||
        existing.modelId !== record.modelId ||
        existing.costUsd !== record.costUsd ||
        existing.costBasis !== record.costBasis
      )
        throw new Error(`${record.id}: conflicting duplicate provider request record`);
      continue;
    }
    unique.set(requestIdentity, record);
  }

  const byProvider = new Map<string, { requests: number; costUsd: number }>();
  const byModel = new Map<string, { requests: number; costUsd: number }>();
  const byCostBasis = new Map<string, { requests: number; costUsd: number }>();
  let costUsd = 0;
  for (const record of unique.values()) {
    costUsd += record.costUsd;
    increment(byProvider, record.provider, record.costUsd);
    increment(byModel, record.modelId, record.costUsd);
    increment(byCostBasis, record.costBasis ?? "unspecified", record.costUsd);
  }
  const remainingUsd = budgetUsd - costUsd;
  if (remainingUsd < 0)
    throw new Error(
      `Recorded experiment spend $${costUsd.toFixed(6)} exceeds $${budgetUsd.toFixed(2)} budget`,
    );

  const groups = (group: Map<string, { requests: number; costUsd: number }>) =>
    [...group.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((left, right) => right.costUsd - left.costUsd || left.key.localeCompare(right.key));
  return {
    sourceRecords: records.length,
    uniqueRequests: unique.size,
    duplicateRecords,
    costUsd,
    budgetUsd,
    remainingUsd,
    byProvider: groups(byProvider),
    byModel: groups(byModel),
    byCostBasis: groups(byCostBasis),
  };
}
