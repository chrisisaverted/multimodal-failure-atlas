import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { groupRunSummaries, runsForFailure } from "@/lib/published-results";
import precisionSummary from "@/data/precision-wire-summary.json";
import { admittedFamilyByCatalogueId, type AdmittedFamilyEvidence } from "@/lib/admitted-evidence";

const percent = (value: number) => `${Math.round(value * 100)}%`;

function interval(correct: number, n: number) {
  if (!n) return { lower: 0, upper: 0 };
  const z = 1.959963984540054;
  const p = correct / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return { lower: Math.max(0, centre - margin), upper: Math.min(1, centre + margin) };
}

function PrecisionResultMatrix({ affectedModels }: { affectedModels?: string }) {
  const rows = precisionSummary.models.flatMap((model) =>
    (
      [
        ["native image", model.native],
        ["numbered oracle control", model.oracle],
      ] as const
    ).map(([condition, result]) => {
      const bounds = interval(result.adjudicatedCorrect, result.substantiveAnswers);
      return { model, condition, result, ...bounds };
    }),
  );
  return (
    <div className="result-matrix" aria-label="Verified model result matrix">
      <div className="result-matrix-head">
        <span>Model snapshot</span>
        <span>Input condition</span>
        <span>Accuracy · 95% CI</span>
        <span>Samples</span>
      </div>
      {rows.map(({ model, condition, result, lower, upper }) => (
        <div className="result-matrix-row" key={`${model.modelId}-${condition}`}>
          <span>
            <b>{model.modelId}</b>
            <small>openrouter · {model.reasoningEffort} reasoning</small>
          </span>
          <span>{condition}</span>
          <span>
            <b>{percent(result.adjudicatedCorrect / result.substantiveAnswers)}</b>
            <small>
              {percent(lower)}–{percent(upper)}
            </small>
          </span>
          <span>{result.substantiveAnswers}</span>
        </div>
      ))}
      <p className="affected-model-scope">
        <span>Affected-model scope</span>
        This frozen holdout reports paired native and control results for three routes. One Qwen control
        response was counted correct by the recorded human adjudication. {affectedModels}
      </p>
    </div>
  );
}

function AdmittedResultMatrix({ evidence }: { evidence: AdmittedFamilyEvidence }) {
  const rows = evidence.models.flatMap((model) => [
    { model, label: evidence.nativeCondition, result: model.native },
    { model, label: evidence.controlCondition, result: model.control },
  ]);
  return (
    <div className="result-matrix" aria-label="Frozen admitted result matrix">
      <div className="result-matrix-head">
        <span>Model snapshot</span>
        <span>Input condition</span>
        <span>Accuracy · 95% CI</span>
        <span>Samples</span>
      </div>
      {rows.map(({ model, label, result }) => (
        <div className="result-matrix-row" key={`${model.modelId}-${label}`}>
          <span>
            <b>{model.modelVersion}</b>
            <small>openrouter · {model.upstreamProvider ?? "pinned upstream"}</small>
          </span>
          <span>{label.replaceAll("-", " ")}</span>
          <span>
            <b>{percent(result.solveRate ?? 0)}</b>
            <small>
              {result.lower95 === null ? "—" : `${percent(result.lower95)}–${percent(result.upper95 ?? 0)}`}
            </small>
          </span>
          <span>
            {result.substantiveAnswers}
            {result.pendingReview ? <small>{result.pendingReview} excluded</small> : null}
          </span>
        </div>
      ))}
      <p className="affected-model-scope">
        <span>Frozen evidence scope</span>
        Observed below-half admission uses only substantive native answers. Controls diagnose the task but are
        not required to recover, and 95% intervals are reported without converting the observation into a
        population-level universal claim.
      </p>
    </div>
  );
}

export function ResultMatrix({
  affectedModels,
  failureModeId,
}: {
  affectedModels?: string;
  failureModeId: string;
}) {
  const admitted = admittedFamilyByCatalogueId.get(failureModeId);
  if (admitted) return <AdmittedResultMatrix evidence={admitted} />;
  if (failureModeId === "identity-conditioned-exact-counting") {
    return <PrecisionResultMatrix affectedModels={affectedModels} />;
  }
  const summaries = groupRunSummaries(runsForFailure(failureModeId));
  return (
    <div className="result-matrix" aria-label="Verified model result matrix">
      <div className="result-matrix-head">
        <span>Model snapshot</span>
        <span>Input condition</span>
        <span>Accuracy · 95% CI</span>
        <span>Samples</span>
      </div>
      {summaries.length ? (
        summaries.map((summary) => (
          <div className="result-matrix-row" key={`${summary.modelVersion}-${summary.inputCondition}`}>
            <span>
              <b>{summary.modelVersion}</b>
              <small>
                {summary.provider}
                {summary.upstreamProvider !== "direct" ? ` · ${summary.upstreamProvider}` : ""}
              </small>
            </span>
            <span>{summary.inputCondition.replaceAll("-", " ")}</span>
            <span>
              <b>{percent(summary.accuracy)}</b>
              <small>
                {percent(summary.lower95)}–{percent(summary.upper95)}
              </small>
            </span>
            <span>
              {summary.n}
              {summary.parseFailures ? <small>{summary.parseFailures} review</small> : null}
            </span>
          </div>
        ))
      ) : (
        <div className="result-matrix-empty">
          <DatabaseZap size={25} aria-hidden="true" />
          <p>
            <b>No verified runs for this family.</b>
            Empty means unevaluated—not zero accuracy. Fixtures and illustrative curves are excluded.
          </p>
          <Link href="/methods">Read the admission standard</Link>
        </div>
      )}
      <p className="affected-model-scope">
        <span>Affected-model scope</span>
        {summaries.length
          ? `This pilot reports ${summaries.length} current model-input summaries for this family. ${affectedModels ? `Literature scope: ${affectedModels}` : "It does not establish universal model scope."}`
          : (affectedModels ?? "No current cross-model affected set has been established.")}
      </p>
    </div>
  );
}
