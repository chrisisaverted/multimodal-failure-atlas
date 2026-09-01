import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Download, FlaskConical, UsersRound } from "lucide-react";
import type { AdmittedFamilyEvidence } from "@/lib/admitted-evidence";

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const modelName = (id: string) => id.split("/").at(-1)?.replaceAll("-", " ") ?? id;

export function AdmittedEvidencePanel({ evidence }: { evidence: AdmittedFamilyEvidence }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <section className="section-shell admitted-evidence" aria-labelledby="admitted-evidence-title">
      <div className="admitted-evidence-copy">
        <p className="eyebrow">
          Frozen atlas holdout · family difficulty {evidence.sample.difficulty}/100 · exact public artifact
        </p>
        <h2 id="admitted-evidence-title">Try the case before revealing the construction.</h2>
        <p>{evidence.sample.question}</p>
        <div className="admitted-answer-options" aria-label="Allowed answers">
          {evidence.sample.answerOptions.map((answer) => (
            <span key={answer}>{answer}</span>
          ))}
        </div>
        <details className="construction-answer">
          <summary>Reveal construction-grounded answer</summary>
          <p>
            <b>{evidence.sample.expectedAnswer}</b> · seed {evidence.sample.seed} · difficulty{" "}
            {evidence.sample.difficulty}
          </p>
        </details>
      </div>
      <div className="admitted-stimulus">
        {evidence.sample.mimeType === "video/mp4" ? (
          <video controls playsInline preload="metadata" aria-label="Exact frozen holdout video">
            <source src={`${basePath}${evidence.sample.artifactPath}`} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={`${basePath}${evidence.sample.artifactPath}`}
            alt="Exact frozen holdout image"
            width={1800}
            height={1000}
            unoptimized
          />
        )}
      </div>
      <div className="admitted-scorecard">
        <div className="admitted-scorecard-head">
          <div>
            <p className="eyebrow">Observed admission result</p>
            <h3>Every route below 50%.</h3>
          </div>
          <span>
            <CheckCircle2 size={17} /> 16 substantive native answers per route
          </span>
        </div>
        <div className="admitted-model-grid">
          {evidence.models.map((model) => (
            <article key={model.modelId}>
              <span>{modelName(model.modelId)}</span>
              <strong>{percent(model.native.solveRate)}</strong>
              <p>
                {model.native.correct}/{model.native.substantiveAnswers} native
              </p>
              <small>
                95% Wilson {percent(model.native.lower95)}–{percent(model.native.upper95)} · control{" "}
                {model.control.correct}/{model.control.substantiveAnswers}
              </small>
              {model.native.pendingReview ? (
                <em>{model.native.pendingReview} non-substantive request(s), excluded</em>
              ) : null}
            </article>
          ))}
        </div>
        <div className="admitted-evidence-notes">
          <p>
            <FlaskConical size={17} /> Observed below-half is the admission rule; the Wilson intervals remain
            visible and may cross 50%.
          </p>
          <p>
            <UsersRound size={17} /> Human solvability: {evidence.humanSolvability}. Construction truth is not
            a human baseline.
          </p>
        </div>
        <div className="admitted-evidence-links">
          <a
            href={`${basePath}/evaluations/${evidence.planId}/manifest.json`}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={15} /> Frozen manifest
          </a>
          <Link href="/runs">Inspect response-level records</Link>
          <span title={evidence.planSha256}>Plan {evidence.planSha256.slice(0, 12)}…</span>
        </div>
      </div>
    </section>
  );
}
