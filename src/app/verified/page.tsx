import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ImageIcon, Video } from "lucide-react";
import { admittedEvidence } from "@/lib/admitted-evidence";
import {
  easiestRouteRate,
  orderByUniversalHardness,
  pooledNativeRate,
  weakestControlRate,
} from "@/lib/admitted-analysis";
import { failureModesById } from "@/lib/catalogue";
import { FailureLandscape } from "@/components/failure-landscape";

export const metadata: Metadata = { title: "Verified failures" };

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const modelName = (id: string) => id.split("/").at(-1)?.replaceAll("-", " ") ?? id;
export default function VerifiedPage() {
  const ordered = orderByUniversalHardness(admittedEvidence.families);
  const imageCount = ordered.filter((family) => family.modality === "image").length;
  const videoCount = ordered.filter((family) => family.modality === "video").length;

  return (
    <section className="section-shell page-section verified-page">
      <header className="page-header verified-header">
        <p className="eyebrow">Frozen evidence · generated 1 September 2026</p>
        <h1>
          Hard by construction.
          <br />
          <em>Checked by response.</em>
        </h1>
        <p>
          Twenty synthetic families met the same preregistered admission rule across three strong frontier
          routes, and every current family also passed a frozen two-route expansion. These are observed
          behavioral results—not proof of a particular internal mechanism.
        </p>
      </header>

      <div className="verified-stat-grid" aria-label="Evidence overview">
        <article>
          <strong>{ordered.length}</strong>
          <span>Admitted families</span>
        </article>
        <article>
          <strong>{imageCount}</strong>
          <span>Image families</span>
        </article>
        <article>
          <strong>{videoCount}</strong>
          <span>Video families</span>
        </article>
        <article>
          <strong>5</strong>
          <span>Frozen routes per current family</span>
        </article>
      </div>

      <div className="verified-rule">
        <CheckCircle2 size={22} />
        <p>
          <b>Admission rule:</b> every selected route must provide at least 16 substantive answers and score
          strictly below 50% on the untouched native-media holdout. Silence, errors, unsupported inputs,
          parser failures, and output exhaustion never count as failures.
        </p>
      </div>

      <FailureLandscape families={admittedEvidence.families} />

      <div className="verified-list">
        {ordered.map((family, index) => {
          const mode = failureModesById.get(family.catalogueId);
          const controlFloor = weakestControlRate(family);
          return (
            <article className="verified-family" key={family.planId}>
              <div className="verified-rank">{String(index + 1).padStart(2, "0")}</div>
              <div className="verified-family-copy">
                <span className="verified-modality">
                  {family.modality === "video" ? <Video size={15} /> : <ImageIcon size={15} />}
                  {family.modality}
                </span>
                <h2>{mode?.title ?? family.catalogueId}</h2>
                <p>{mode?.subtitle}</p>
                <small>
                  Frozen family-local difficulty {family.difficultySetting.label} · easiest native route{" "}
                  {percent(easiestRouteRate(family))} · pooled descriptive solve rate{" "}
                  {percent(pooledNativeRate(family))} · weakest control route {percent(controlFloor)}
                </small>
              </div>
              <div className="verified-route-grid">
                {family.models.map((model) => (
                  <div key={model.modelId}>
                    <span>{modelName(model.modelId)}</span>
                    <strong>
                      {model.native.correct}/{model.native.substantiveAnswers}
                    </strong>
                    <small>{percent(model.native.solveRate)} native</small>
                  </div>
                ))}
              </div>
              <Link
                href={`/failure/${family.catalogueId}`}
                aria-label={`Inspect ${mode?.title ?? family.catalogueId}`}
              >
                Evidence <ArrowUpRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>

      <div className="verified-caveat">
        <p>
          Ordering uses the easiest route&apos;s observed accuracy, with pooled accuracy only as a
          tie-breaker, so weaker routes cannot hide a stronger route. It is not a calibrated psychometric
          scale, and the three routes are not independent samples from “all models.” The displayed difficulty
          values parameterize different generators and are not comparable between families. Controls diagnose
          whether a simpler presentation recovers performance; weak controls limit causal claims.
        </p>
        <Link href="/methods">Read the evidence standard</Link>
        <Link href="/human-study">Open the human study instrument</Link>
        <Link href="/replication">Inspect untouched route replication</Link>
        <a href="https://github.com/chrisisaverted/multimodal-failure-atlas/blob/main/docs/difficulty-contract.md">
          Read the difficulty-setting contract
        </a>
        <Link href="/runs">Open the response ledger</Link>
      </div>
    </section>
  );
}
