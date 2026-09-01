import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Database, ShieldCheck } from "lucide-react";
import { admittedEvidence } from "@/lib/admitted-evidence";
import { routeExpansionModels } from "@/lib/external-replication";
import protocol from "../../../evaluation/plans/openrouter-frontier-matrix-v2.json";

export const metadata: Metadata = { title: "Models" };

const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function ModelsPage() {
  const firstFamily = admittedEvidence.families[0]!;
  const strictModelIds = [
    ...firstFamily.models.map((model) => model.modelId),
    ...(routeExpansionModels(firstFamily) ?? []).map((model) => model.modelId),
  ];
  const strictRoutes = strictModelIds.map((modelId) => {
    const familyRoutes = admittedEvidence.families.map((family) => {
      const routes = [...family.models, ...(routeExpansionModels(family) ?? [])];
      const route = routes.find((model) => model.modelId === modelId);
      if (!route) throw new Error(`Missing ${modelId} route expansion for ${family.planId}`);
      return route;
    });
    const nativeCorrect = familyRoutes.reduce((sum, model) => sum + model.native.correct, 0);
    const nativeN = familyRoutes.reduce((sum, model) => sum + model.native.substantiveAnswers, 0);
    const controlCorrect = familyRoutes.reduce((sum, model) => sum + model.control.correct, 0);
    const controlN = familyRoutes.reduce((sum, model) => sum + model.control.substantiveAnswers, 0);
    const pending = familyRoutes.reduce((sum, model) => {
      const nativePending =
        "pendingReview" in model.native
          ? model.native.pendingReview
          : model.native.missingCandidateIds.length;
      const controlPending =
        "pendingReview" in model.control
          ? model.control.pendingReview
          : model.control.missingCandidateIds.length;
      return sum + nativePending + controlPending;
    }, 0);
    const costUsd = familyRoutes.reduce(
      (sum, model) => sum + model.native.costUsd + model.control.costUsd,
      0,
    );
    return {
      modelId,
      upstreamProvider: familyRoutes[0]!.upstreamProvider,
      nativeCorrect,
      nativeN,
      controlCorrect,
      controlN,
      pending,
      costUsd,
    };
  });
  const strictCost = strictRoutes.reduce((sum, route) => sum + route.costUsd, 0);
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

      {strictRoutes.length ? (
        <>
          <div className="integrity-banner verified-banner">
            <ShieldCheck size={24} />
            <div>
              <b>
                {admittedEvidence.families.length} strict families recur across five evaluated routes; a
                broader frozen pilot covers {protocol.models.length} model families.
              </b>
              <p>
                The current cohort combines three admission routes with two frozen route-expansion routes,
                using 16 substantive native answers per family and route. The broader historical protocol is{" "}
                {protocol.id}; the evidence levels are not pooled into a leaderboard.
              </p>
            </div>
          </div>
          <div className="observatory-summary">
            {strictRoutes.map((route) => (
              <article key={route.modelId}>
                <p>20-family current native cohort</p>
                <h2>{route.modelId}</h2>
                <strong>{percent(route.nativeCorrect / route.nativeN)}</strong>
                <span>
                  {route.nativeCorrect}/{route.nativeN} descriptive native responses · controls{" "}
                  {route.controlCorrect}/{route.controlN}
                </span>
                {route.pending ? <small>{route.pending} non-substantive request(s) excluded</small> : null}
              </article>
            ))}
          </div>
          <p className="observatory-cost">
            Recorded provider API cost for the five-route current-family evidence:{" "}
            <b>${strictCost.toFixed(4)}</b>. Aggregate route rates are descriptive because families differ;
            individual family results, exclusions, and uncertainty appear in the verified view and response
            ledger.
          </p>
          <Link className="text-link" href="/verified">
            Compare the 20 strict family results
          </Link>
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
