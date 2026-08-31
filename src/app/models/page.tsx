import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Database, ShieldCheck } from "lucide-react";
import { groupRunSummaries, publishedRuns } from "@/lib/published-results";
import protocol from "../../../evaluation/plans/openrouter-frontier-matrix-v2.json";

export const metadata: Metadata = { title: "Models" };

const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function ModelsPage() {
  const summaries = groupRunSummaries(publishedRuns);
  const totalCost = publishedRuns.reduce((sum, run) => sum + run.costUsd, 0);
  return (
    <section className="section-shell page-section">
      <header className="page-header">
        <p className="eyebrow">Model observatory · immutable snapshots</p>
        <h1>
          Results need
          <br />
          <em>a timestamp.</em>
        </h1>
        <p>
          Model aliases move, provider pipelines differ, and a score without raw provenance expires quickly.
          Every admitted result preserves the exact media hash, prompt, model version, and evaluation date.
        </p>
      </header>

      {summaries.length ? (
        <>
          <div className="integrity-banner verified-banner">
            <ShieldCheck size={24} />
            <div>
              <b>
                {publishedRuns.length} genuine responses across {protocol.models.length} model families are
                published.
              </b>
              <p>
                Frozen protocol {protocol.id}. These are diagnostic observations, not a leaderboard; every
                summary includes its denominator and Wilson uncertainty.
              </p>
            </div>
          </div>
          <div className="observatory-summary">
            {summaries.map((summary) => (
              <article key={`${summary.modelVersion}-${summary.inputCondition}`}>
                <p>{summary.inputCondition.replaceAll("-", " ")}</p>
                <h2>{summary.modelVersion}</h2>
                <strong>{percent(summary.accuracy)}</strong>
                <span>
                  95% CI {percent(summary.lower95)}–{percent(summary.upper95)} · n={summary.n}
                </span>
              </article>
            ))}
          </div>
          <p className="observatory-cost">
            Provider-reported final-run API cost: <b>${totalCost.toFixed(4)}</b>. Individual family results,
            no-answer outcomes, and sample counts appear in the response ledger.
          </p>
          <Link className="text-link" href="/runs">
            Inspect every response and provenance record
          </Link>
        </>
      ) : (
        <div className="integrity-banner">
          <ShieldCheck size={24} />
          <div>
            <b>No genuine model evaluations have been run by this project yet.</b>
            <p>
              Adapter readiness is not evidence of capability. This page deliberately shows an empty baseline
              instead of invented demonstration scores.
            </p>
          </div>
        </div>
      )}

      <div className="model-slot-grid">
        {protocol.models.map((entry) => (
          <article key={entry.modelId}>
            <div>
              <span className="status-dot" />
              Evaluated
            </div>
            <h2>{entry.modelId}</h2>
            <p>
              {entry.modelRevision} via {entry.upstreamProvider}
            </p>
            <small>
              Frozen route · {entry.quantization} precision label · no fallback · data collection denied
            </small>
          </article>
        ))}
      </div>
      <div className="provenance-panel">
        <div>
          <Database />
          <h3>Immutable run record</h3>
          <p>Media hash, prompt hash, generator version, seed, raw response and scorer travel together.</p>
        </div>
        <div>
          <Clock3 />
          <h3>Longitudinal by design</h3>
          <p>A new model result never overwrites an old one. Improvement and regression remain visible.</p>
        </div>
      </div>
      <Link className="text-link" href="/methods">
        Read the evaluation admission standard
      </Link>
    </section>
  );
}
