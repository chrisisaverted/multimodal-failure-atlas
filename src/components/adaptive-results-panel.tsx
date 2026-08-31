import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import adaptiveRuns from "@/data/adaptive-runs.json";
import summary from "@/data/adaptive-summary.json";

const percent = (numerator: number, denominator: number) =>
  denominator ? String(Math.round((numerator / denominator) * 100)) + "%" : "—";

function condition(run: (typeof adaptiveRuns)[number]) {
  return run.preprocessingNotes.find((entry) => entry.startsWith("Condition: "))?.slice(11) ?? "native-1x";
}

export function AdaptiveResultsPanel() {
  const confirmatory = adaptiveRuns.filter(
    (run) => run.evaluationPlanId === "lattice-counting-confirmatory-v1",
  );
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const modelRows = [...new Set(confirmatory.map((run) => run.modelId))].sort().map((modelId) => {
    const rows = confirmatory.filter((run) => run.modelId === modelId);
    const aggregate = (target: string) => {
      const selected = rows.filter((run) => condition(run) === target);
      const substantive = selected.filter((run) => !run.emptyResponse && run.status === "verified");
      return {
        correct: substantive.filter((run) => run.correct).length,
        substantive: substantive.length,
        noAnswer: selected.filter((run) => run.emptyResponse).length,
      };
    };
    return { modelId, native: aggregate("native-1x"), slow: aggregate("slow-motion-4x") };
  });
  const failureExamples = confirmatory
    .filter((run) => run.status === "verified" && !run.emptyResponse && !run.correct)
    .slice(0, 6);

  return (
    <section className="section-shell adaptive-results-section">
      <div className="integrity-banner verified-banner">
        <ShieldCheck size={24} />
        <div>
          <b>
            {summary.discovery.requests} discovery responses and {summary.confirmatory.requests} frozen
            holdout responses.
          </b>
          <p>
            Every response keeps its exact plan, protocol, prompt, media hash, route, raw answer, and cost.
            Human solvability remains {summary.humanSolvability}.
          </p>
        </div>
      </div>

      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Selected without rewarding silence</p>
          <h2>
            Two boundaries,
            <br />
            frozen before confirmation
          </h2>
        </div>
        <p>
          Selection used only substantive wrong answers. No-answer and review outcomes are shown, but had zero
          hardness weight.
        </p>
      </div>
      <div className="selected-cell-grid">
        {summary.selectedCells.map((cell, index) => (
          <article key={cell.cellId}>
            <span>Promoted cell 0{index + 1}</span>
            <h3>{Math.round(cell.substantiveFailureRate * 100)}% discovery failure</h3>
            <p>
              {cell.parameters.flashDurationMs} ms flash · {cell.parameters.intervalMs} ms interval · phase{" "}
              {cell.parameters.phaseMs} ms
            </p>
            <small>
              {cell.incorrectAnswers}/{cell.scoredAnswers} substantive answers wrong · Wilson lower bound{" "}
              {Math.round(cell.failureWilsonLowerBound * 100)}%
            </small>
          </article>
        ))}
      </div>

      <div className="adaptive-matrix-wrap">
        <div className="adaptive-matrix-heading">
          <div>
            <p className="eyebrow">Paired causal probe</p>
            <h2>Native rate versus exact 4× slow motion</h2>
          </div>
          <div className="recovery-count">
            <CheckCircle2 />
            <strong>{summary.confirmatory.nativeFailureRecoveredBySlowMotion}</strong>
            <span>native failures recovered by slowing the same frames</span>
          </div>
        </div>
        <div className="adaptive-result-table" role="table" aria-label="Confirmatory model results">
          <div className="adaptive-result-row adaptive-result-header" role="row">
            <span>Model route</span>
            <span>Native</span>
            <span>Slow 4×</span>
            <span>No answer</span>
          </div>
          {modelRows.map((row) => (
            <div className="adaptive-result-row" role="row" key={row.modelId}>
              <b>{row.modelId}</b>
              <span>
                {row.native.correct}/{row.native.substantive} ·{" "}
                {percent(row.native.correct, row.native.substantive)}
              </span>
              <span>
                {row.slow.correct}/{row.slow.substantive} · {percent(row.slow.correct, row.slow.substantive)}
              </span>
              <span>{row.native.noAnswer + row.slow.noAnswer}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="adaptive-failure-examples">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Exact misses · confirmatory only</p>
            <h2>What the models actually said</h2>
          </div>
          <p>
            These are response records, not curated anecdotes; the first six substantive misses are shown.
          </p>
        </div>
        <div className="adaptive-example-list">
          {failureExamples.map((run) => (
            <details key={run.id}>
              <summary>
                <span>{run.modelId}</span>
                <b>
                  answered {run.parsedAnswer || "unparsed"}; expected {run.expectedAnswer}
                </b>
                <small>{condition(run).replaceAll("-", " ")}</small>
              </summary>
              <div>
                <p>{run.rawResponse}</p>
                {run.artifactPath ? (
                  <a href={basePath + run.artifactPath} target="_blank" rel="noreferrer">
                    Open exact video <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
