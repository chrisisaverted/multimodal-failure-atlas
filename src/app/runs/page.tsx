import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Database, ShieldCheck } from "lucide-react";
import { failureModesById } from "@/lib/catalogue";
import { catalogueIdForRun, publishedRuns } from "@/lib/published-results";
import { admittedEvidence, admittedRunCount } from "@/lib/admitted-evidence";

export const metadata: Metadata = { title: "Run ledger" };

const percent = (value: number) => `${Math.round(value * 100)}%`;
const shortHash = (value: string) => `${value.slice(0, 12)}…${value.slice(-8)}`;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function RunsPage() {
  const strictRoutes = admittedEvidence.families[0]!.models.map((route) => {
    const familyRoutes = admittedEvidence.families.map((family) =>
      family.models.find((model) => model.modelId === route.modelId)!,
    );
    const correct = familyRoutes.reduce((sum, model) => sum + model.native.correct, 0);
    const n = familyRoutes.reduce((sum, model) => sum + model.native.substantiveAnswers, 0);
    const pending = familyRoutes.reduce(
      (sum, model) => sum + model.native.pendingReview + model.control.pendingReview,
      0,
    );
    return { modelId: route.modelId, correct, n, pending };
  });
  const visibleRuns = [...publishedRuns].reverse().slice(0, 200);

  return (
    <section className="section-shell page-section run-ledger-page">
      <header className="page-header">
        <p className="eyebrow">Append-only evidence · response level</p>
        <h1>
          Trust the record,
          <br />
          <em>not the headline.</em>
        </h1>
        <p>
          Every admitted response retains the exact stimulus and prompt hashes, provider-returned model
          version, raw answer, scorer decision, timestamp, preprocessing notes, and cost basis.
        </p>
      </header>

      {publishedRuns.length === 0 ? (
        <div className="integrity-banner">
          <Database size={24} />
          <div>
            <b>The genuine-run ledger is empty.</b>
            <p>Fixture smoke tests never appear here. Records are published only after a remote model run.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="integrity-banner verified-banner">
            <ShieldCheck size={24} />
            <div>
              <b>{publishedRuns.length} genuine responses with frozen provenance.</b>
              <p>
                Showing the latest {visibleRuns.length} records from all published campaigns below. The
                downloadable strict-family ledger contains all {admittedRunCount} requests—including
                non-substantive attempts—and is not reduced to the visible table.
              </p>
              <a className="ledger-download" href={`${basePath}/evidence/admitted-runs.json`}>
                Download all admitted run records
              </a>
            </div>
          </div>

          <div className="ledger-summary-grid">
            {strictRoutes.map((route) => (
              <article key={route.modelId}>
                <span>strict native cohort · 20 families</span>
                <h2>{route.modelId}</h2>
                <strong>{percent(route.correct / route.n)}</strong>
                <p>
                  {route.correct}/{route.n} descriptive aggregate · each family remains below 50%
                </p>
                {route.pending > 0 ? (
                  <small>{route.pending} non-substantive request(s) excluded</small>
                ) : null}
              </article>
            ))}
          </div>

          <div className="run-record-list">
            {visibleRuns.map((run, index) => {
              const catalogueId = catalogueIdForRun(run);
              const mode = failureModesById.get(catalogueId);
              return (
                <details className="run-record" key={run.id}>
                  <summary>
                    <span className="run-record-index">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <b>{mode?.shortTitle ?? run.failureModeId}</b>
                      <small>
                        Seed {run.seed} · {run.inputCondition.replaceAll("-", " ")}
                      </small>
                    </span>
                    <span
                      className={
                        run.status === "verified" ? (run.correct ? "run-pass" : "run-fail") : "run-review"
                      }
                    >
                      {run.status === "verified" ? (run.correct ? "Correct" : "Incorrect") : "Review"}
                    </span>
                  </summary>
                  <div className="run-record-body">
                    <dl className="run-provenance-grid">
                      <div>
                        <dt>Model snapshot</dt>
                        <dd>{run.modelVersion}</dd>
                      </div>
                      <div>
                        <dt>Evaluated</dt>
                        <dd>{new Date(run.evaluatedAt).toISOString()}</dd>
                      </div>
                      <div>
                        <dt>Gateway / upstream</dt>
                        <dd>
                          {run.provider} / {run.upstreamProvider ?? "direct"}
                        </dd>
                      </div>
                      <div>
                        <dt>Requested route</dt>
                        <dd>{run.routingProvider ?? "direct"}</dd>
                      </div>
                      <div>
                        <dt>Media SHA-256</dt>
                        <dd title={run.mediaSha256}>{shortHash(run.mediaSha256)}</dd>
                      </div>
                      <div>
                        <dt>Prompt SHA-256</dt>
                        <dd title={run.promptSha256}>{shortHash(run.promptSha256)}</dd>
                      </div>
                      <div>
                        <dt>Generator</dt>
                        <dd>{run.generatorVersion}</dd>
                      </div>
                      <div>
                        <dt>Logical evaluation key</dt>
                        <dd title={run.id}>{shortHash(run.id)}</dd>
                      </div>
                      <div>
                        <dt>Provider request ID</dt>
                        <dd title={run.requestId}>
                          {run.requestId ? shortHash(run.requestId) : "not supplied"}
                        </dd>
                      </div>
                      <div>
                        <dt>Evaluation plan</dt>
                        <dd>{run.evaluationPlanId ?? "not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Plan SHA-256</dt>
                        <dd title={run.evaluationPlanSha256}>
                          {run.evaluationPlanSha256 ? shortHash(run.evaluationPlanSha256) : "not recorded"}
                        </dd>
                      </div>
                      <div>
                        <dt>Evaluation protocol</dt>
                        <dd>{run.evaluationProtocolId ?? "not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Protocol SHA-256</dt>
                        <dd title={run.evaluationProtocolSha256}>
                          {run.evaluationProtocolSha256
                            ? shortHash(run.evaluationProtocolSha256)
                            : "not recorded"}
                        </dd>
                      </div>
                      <div>
                        <dt>Reasoning policy</dt>
                        <dd>
                          {run.reasoningEffort ?? "provider default"}
                          {run.excludeReasoning ? " · trace excluded" : ""}
                        </dd>
                      </div>
                      <div>
                        <dt>Latency</dt>
                        <dd>{run.latencyMs.toLocaleString()} ms</dd>
                      </div>
                      <div>
                        <dt>Cost</dt>
                        <dd>
                          ${run.costUsd.toFixed(6)} {run.costBasis ?? "estimated"}
                        </dd>
                      </div>
                      <div>
                        <dt>Tokens</dt>
                        <dd>
                          {run.usage?.promptTokens ?? "?"} in / {run.usage?.completionTokens ?? "?"} out
                        </dd>
                      </div>
                      <div>
                        <dt>System fingerprint</dt>
                        <dd title={run.systemFingerprint}>{run.systemFingerprint ?? "not supplied"}</dd>
                      </div>
                      <div>
                        <dt>Finish reason</dt>
                        <dd>
                          {run.finishReason ?? "not supplied"}
                          {run.emptyResponse ? " · no answer emitted" : ""}
                        </dd>
                      </div>
                    </dl>

                    <div className="run-answer-grid">
                      <div>
                        <span>Question</span>
                        <p>{run.prompt}</p>
                      </div>
                      <div>
                        <span>Raw model response</span>
                        <p>{run.rawResponse || "(empty response)"}</p>
                      </div>
                      <div>
                        <span>Expected / parsed</span>
                        <p>
                          {run.expectedAnswer} / {run.parsedAnswer || "unparsed"}
                        </p>
                      </div>
                      <div>
                        <span>Scorer / status</span>
                        <p>
                          {run.scorer} / {run.status}
                        </p>
                      </div>
                    </div>

                    <div className="run-record-links">
                      {run.artifactPath ? (
                        <a href={`${basePath}${run.artifactPath}`} target="_blank" rel="noreferrer">
                          Open exact stimulus <ArrowUpRight size={14} />
                        </a>
                      ) : null}
                      <Link href={`/failure/${catalogueId}`}>Open failure-mode exhibit</Link>
                    </div>
                    <p className="run-preprocessing">Preprocessing: {run.preprocessingNotes.join(" · ")}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
