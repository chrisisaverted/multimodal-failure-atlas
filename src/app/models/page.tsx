import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Database, ShieldCheck } from "lucide-react";
import { groupRunSummaries, publishedRuns } from "@/lib/published-results";

export const metadata: Metadata = { title: "Models" };

const slots = [
  [
    "Google Gemini",
    "Official docs specify direct video, image, and extracted-frame inputs; adapter implemented",
    "Ready",
  ],
  [
    "OpenAI GPT",
    "Official vision guide documents image inputs; no native video-analysis input is documented there",
    "Research slot",
  ],
  [
    "Anthropic Claude",
    "Official vision guide documents image blocks and joint analysis of multiple images",
    "Research slot",
  ],
  [
    "Moonshot Kimi",
    "Exact current video endpoint contract has not been established from official API docs",
    "Unavailable",
  ],
  [
    "Qwen3-VL open weights",
    "Official model card reports video understanding; exact local serving runtime pending",
    "Unavailable",
  ],
  [
    "Z.AI GLM-4.5V",
    "Official docs list video, image, text, and file input; request conformance pending",
    "Unavailable",
  ],
] as const;

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
              <b>{publishedRuns.length} genuine model responses are published.</b>
              <p>
                These are labelled frontier-pilot observations, not a leaderboard. The small family samples
                expose candidate failures and include Wilson uncertainty.
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
            Recorded estimated/reported API cost: <b>${totalCost.toFixed(4)}</b>. Individual family results
            and sample counts appear on their exhibit pages.
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
        {slots.map(([name, adapter, status]) => (
          <article key={name}>
            <div>
              <span className={`status-dot ${name === "Google Gemini" ? "" : "muted"}`} />
              {status}
            </div>
            <h2>{name}</h2>
            <p>{adapter}</p>
            <small>
              Requires a dated model ID, server-only credential, preflight estimate, and committed seed set.
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
