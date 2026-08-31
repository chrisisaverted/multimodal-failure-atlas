export const PROJECT_BUDGET_USD = 1000;
export const DEFAULT_RUN_CAP_USD = 25;
export const RESERVED_BUDGET_USD = 100;

export class BudgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetError";
  }
}

type Environment = Record<string, string | undefined>;

export function configuredRunCap(env: Environment = process.env) {
  const value = Number(env.ATLAS_MAX_RUN_COST_USD ?? DEFAULT_RUN_CAP_USD);
  if (!Number.isFinite(value) || value <= 0 || value > PROJECT_BUDGET_USD - RESERVED_BUDGET_USD) {
    throw new BudgetError("ATLAS_MAX_RUN_COST_USD must be positive and preserve the $100 project reserve.");
  }
  return value;
}

export function assertWithinBudget(estimatedCostUsd: number, spentUsd = 0, env: Environment = process.env) {
  if (!Number.isFinite(estimatedCostUsd) || estimatedCostUsd < 0)
    throw new BudgetError("A finite non-negative preflight estimate is required.");
  const runCap = configuredRunCap(env);
  if (estimatedCostUsd > runCap)
    throw new BudgetError(
      `Estimated run cost $${estimatedCostUsd.toFixed(2)} exceeds the configured $${runCap.toFixed(2)} run cap.`,
    );
  if (spentUsd + estimatedCostUsd > PROJECT_BUDGET_USD - RESERVED_BUDGET_USD)
    throw new BudgetError("Run would consume the protected $100 project reserve.");
  return {
    approved: true as const,
    runCapUsd: runCap,
    remainingAfterUsd: PROJECT_BUDGET_USD - spentUsd - estimatedCostUsd,
  };
}
