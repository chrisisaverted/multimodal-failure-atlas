import type { Metadata } from "next";
import { Clock3, Database, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Models" };

const slots = [
  [
    "Google Gemini",
    "Official docs specify direct video, image, and extracted-frame inputs; adapter implemented",
    "Conformance run pending",
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

export default function ModelsPage() {
  return (
    <section className="section-shell page-section">
      <header className="page-header">
        <p className="eyebrow">Model observatory · no unverified runs</p>
        <h1>
          Results need
          <br />
          <em>a timestamp.</em>
        </h1>
        <p>
          Model aliases move, provider pipelines differ, and a score without raw provenance expires quickly.
          The observatory will preserve exact run records rather than a floating leaderboard.
        </p>
      </header>
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
      <div className="model-slot-grid">
        {slots.map(([name, adapter, status]) => (
          <article key={name}>
            <div>
              <span className="status-dot muted" />
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
    </section>
  );
}
