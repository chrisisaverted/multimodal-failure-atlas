import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { groupRunSummaries, runsForFailure } from "@/lib/published-results";

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function ResultMatrix({
  affectedModels,
  failureModeId,
}: {
  affectedModels?: string;
  failureModeId: string;
}) {
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
            <span>{summary.n}</span>
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
        {affectedModels ?? "No current cross-model affected set has been established."}
      </p>
    </div>
  );
}
