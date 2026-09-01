import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import Image from "next/image";
import summary from "@/data/precision-wire-summary.json";
import manifest from "../../public/evaluations/precision-wire-count-confirmatory-v1/manifest.json";

const percent = (correct: number, total: number) => `${Math.round((correct / total) * 100)}%`;

export function PrecisionWireResultsPanel() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const native = manifest.cases.find((item) => item.condition === "native-image")!;
  const oracle = manifest.cases.find((item) => item.condition === "oracle-highlighted-numbered-path")!;
  return (
    <section className="section-shell adaptive-results-section precision-results-section">
      <div className="integrity-banner verified-banner">
        <ShieldCheck size={24} />
        <div>
          <b>Frozen holdout passed the strict below-50% gate on every selected route.</b>
          <p>
            Sixteen unseen diagrams per model, four examples per answer, no silence rewarded, and a paired
            evidence-preserving control. Human solvability remains {summary.humanSolvability}.
          </p>
        </div>
      </div>

      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Confirmed boundary · 01 September 2026</p>
          <h2>
            Trace one identity.
            <br />
            Count exactly.
          </h2>
        </div>
        <p>
          Endpoint tracing and widely spaced counting were not enough. The admitted setting composes 40
          crossings with adjacent exact answers—7, 8, 9, or 10—so a rough magnitude estimate cannot pass.
        </p>
      </div>

      <div className="selected-cell-grid">
        <article>
          <span>Difficulty axis</span>
          <h3>40 crossings</h3>
          <p>One labeled wire among three distractor paths.</p>
          <small>Lower settings remain as boundary controls.</small>
        </article>
        <article>
          <span>Precision axis</span>
          <h3>Adjacent counts</h3>
          <p>Every option differs by only one event.</p>
          <small>Balanced 7 / 8 / 9 / 10 labels.</small>
        </article>
        <article>
          <span>Confirmation</span>
          <h3>16 unseen cases</h3>
          <p>New paths, target wires, seeds, and appearances.</p>
          <small>Exact construction-grounded answers.</small>
        </article>
      </div>

      <div className="adaptive-matrix-wrap">
        <div className="adaptive-matrix-heading">
          <div>
            <p className="eyebrow">Paired causal probe</p>
            <h2>Unmarked path versus numbered oracle</h2>
          </div>
          <div className="recovery-count">
            <CheckCircle2 />
            <strong>3/3</strong>
            <span>routes below 50% native and at least 75% on control</span>
          </div>
        </div>
        <div className="adaptive-result-table" role="table" aria-label="Precision wire confirmatory results">
          <div className="adaptive-result-row adaptive-result-header" role="row">
            <span>Model route</span>
            <span>Native</span>
            <span>Control</span>
            <span>Reasoning</span>
          </div>
          {summary.models.map((model) => (
            <div className="adaptive-result-row" role="row" key={model.modelId}>
              <b>{model.modelId}</b>
              <span>
                {model.native.adjudicatedCorrect}/{model.native.substantiveAnswers} ·{" "}
                {percent(model.native.adjudicatedCorrect, model.native.substantiveAnswers)}
              </span>
              <span>
                {model.oracle.adjudicatedCorrect}/{model.oracle.substantiveAnswers} ·{" "}
                {percent(model.oracle.adjudicatedCorrect, model.oracle.substantiveAnswers)}
              </span>
              <span>{model.reasoningEffort}</span>
            </div>
          ))}
        </div>
        <p className="observatory-cost">
          Kimi&apos;s reasoning is reported as a distinct forced-choice condition because its optional
          reasoning loop exhausted 8,192 tokens without an answer on harder diagrams. Gemini and Qwen use low
          reasoning.
        </p>
      </div>

      <div className="precision-pair-grid">
        <figure>
          <Image
            src={`${basePath}/${native.artifact.replace(/^public\//, "")}`}
            alt="Unmarked wire crossing count task"
            width={1800}
            height={900}
            unoptimized
          />
          <figcaption>
            <b>Primary task</b>
            <span>Trace the labeled wire and count only its crossings.</span>
          </figcaption>
        </figure>
        <figure>
          <Image
            src={`${basePath}/${oracle.artifact.replace(/^public\//, "")}`}
            alt="Same task with target path and crossings highlighted"
            width={1800}
            height={900}
            unoptimized
          />
          <figcaption>
            <b>Positive control</b>
            <span>The path is red and every relevant crossing is numbered.</span>
          </figcaption>
        </figure>
      </div>
      <a
        className="text-link"
        href={`${basePath}/${native.artifact.replace(/^public\//, "")}`}
        target="_blank"
        rel="noreferrer"
      >
        Inspect the exact full-resolution specimen <ExternalLink size={14} />
      </a>
    </section>
  );
}
