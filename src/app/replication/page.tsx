import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Download, ShieldCheck, XCircle } from "lucide-react";
import { failureModesById } from "@/lib/catalogue";
import { externalReplication, replicationStatus } from "@/lib/external-replication";

export const metadata: Metadata = { title: "External replication" };

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const shortModel = (id: string) => id.split("/").at(-1)?.replaceAll("-", " ") ?? id;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const frozenCampaignTitles = new Map([
  ["pair-collision-confirmatory-v1", "Pair-only identity collision counting"],
  ["grid-activation-confirmatory-v3", "Ungated temporal set cardinality"],
]);

export default function ReplicationPage() {
  const complete = externalReplication.families.filter((family) => family.complete).length;
  const replicated = externalReplication.families.filter((family) => family.replicatedBelowHalf).length;
  const nativeAnswers = externalReplication.families.reduce(
    (sum, family) => sum + family.models.reduce((inner, model) => inner + model.native.substantiveAnswers, 0),
    0,
  );

  return (
    <section className="section-shell page-section replication-page">
      <header className="page-header verified-header">
        <p className="eyebrow">Untouched post-confirmatory cohort</p>
        <h1>
          New routes,
          <br />
          <em>same frozen media.</em>
        </h1>
        <p>
          Seed 2.1 Turbo and MiMo 2.5 were evaluated only after the original 20 families and their
          holdouts were fixed. This frozen audit found two threshold crossings; both negative results were
          retained and used to begin new, separately reserved repair cycles in the core atlas.
        </p>
      </header>

      <div className="verified-stat-grid replication-stats" aria-label="Replication overview">
        <article>
          <strong>{replicated}</strong>
          <span>Replicated original families</span>
        </article>
        <article>
          <strong>{complete}</strong>
          <span>Complete families</span>
        </article>
        <article>
          <strong>{nativeAnswers}</strong>
          <span>Substantive native answers</span>
        </article>
        <article>
          <strong>2</strong>
          <span>Untouched routes</span>
        </article>
      </div>

      <div className="verified-rule">
        <ShieldCheck size={22} />
        <p>
          <b>Replication rule:</b> both routes must provide all 16 substantive native answers and each must
          score strictly below 50%. Controls must also be complete before a family receives a terminal
          replication status. Non-substantive attempts remain visible but never become model failures.
        </p>
      </div>

      <div className="replication-route-grid">
        {externalReplication.canonicalCohort.map((route) => (
          <article key={route.modelId}>
            <span>Canonical frozen route</span>
            <h2>{shortModel(route.modelId)}</h2>
            <strong>{route.substantiveAnswers}</strong>
            <p>
              substantive answers from {route.canonicalRequests} canonical requests · $
              {route.costUsd.toFixed(3)} measured cost
            </p>
            <small>{route.protocolSuffixes.join(" · ")}</small>
          </article>
        ))}
      </div>

      <div className="replication-list">
        {externalReplication.families.map((family, index) => {
          const mode = failureModesById.get(family.catalogueId);
          const status = replicationStatus(family);
          return (
            <article className="replication-family" key={family.planId}>
              <div className="verified-rank">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <span className="verified-modality">{family.modality}</span>
                <h2>{frozenCampaignTitles.get(family.planId) ?? mode?.title ?? family.catalogueId}</h2>
                <p>{mode?.subtitle}</p>
              </div>
              <div className="replication-models">
                {family.models.map((model) => (
                  <div key={model.modelId}>
                    <span>{shortModel(model.modelId)}</span>
                    <strong>
                      {model.native.correct}/{model.native.substantiveAnswers}
                    </strong>
                    <small>
                      {percent(model.native.solveRate)} native · control {model.control.correct}/
                      {model.control.substantiveAnswers}
                      {model.native.adjudicatedAnswers + model.control.adjudicatedAnswers > 0
                        ? ` · ${model.native.adjudicatedAnswers + model.control.adjudicatedAnswers} adjudicated`
                        : ""}
                    </small>
                  </div>
                ))}
              </div>
              <div className={`replication-status ${status}`}>
                {status === "replicated" ? (
                  <CheckCircle2 size={17} />
                ) : status === "did-not-replicate" ? (
                  <XCircle size={17} />
                ) : (
                  <CircleDashed size={17} />
                )}
                {status.replaceAll("-", " ")}
              </div>
            </article>
          );
        })}
      </div>

      <div className="verified-caveat replication-audit">
        <p>
          This is route replication, not a fresh family-discovery cohort and not proof of model independence.
          The table reports observed rates with n=16 per condition. There were{" "}
          {externalReplication.audit.noncanonicalAttempts} earlier or abandoned protocol attempts; they cost $
          {externalReplication.audit.allAttemptCostUsd.toFixed(3)}
          in total and remain in the downloadable audit ledger, but are excluded from every canonical score.
          Scorer-pending text enters a denominator only when the published answer-key-blind adjudicator finds
          one unambiguous declared answer; the raw record is never rewritten.
        </p>
        <a href={`${basePath}/evidence/external-replication.json`}>
          <Download size={13} /> Download summary
        </a>
        <a href={`${basePath}/evidence/external-replication-runs.json`}>
          <Download size={13} /> Download response audit
        </a>
        <Link href="/verified">Return to core evidence</Link>
      </div>
    </section>
  );
}
