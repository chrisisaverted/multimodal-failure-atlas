import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { admittedEvidence } from "@/lib/admitted-evidence";
import { currentFamilyRoutes, orderByUniversalHardness, weakestControlRate } from "@/lib/admitted-analysis";
import { failureModesById } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Compare" };

const shortModel = (id: string) => {
  if (id.includes("gemini")) return "Gemini";
  if (id.includes("qwen")) return "Qwen";
  if (id.includes("kimi")) return "Kimi";
  if (id.includes("seed")) return "Seed";
  if (id.includes("mimo")) return "MiMo";
  return id.split("/").at(-1) ?? id;
};
const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function ComparePage() {
  const families = orderByUniversalHardness(admittedEvidence.families);
  const routeIds = currentFamilyRoutes(families[0]!).map((route) => route.modelId);

  return (
    <section className="section-shell page-section comparison-page">
      <header className="page-header">
        <p className="eyebrow">Five-route comparison · current frozen families</p>
        <h1>
          One matrix.
          <br />
          <em>Twenty boundaries.</em>
        </h1>
        <p>
          Every cell below is a genuine 16-answer native-media holdout. Families are ordered against their
          easiest route, so a weak model cannot make a task look universally hard.
        </p>
      </header>

      <div className="comparison-stat-grid" aria-label="Comparison overview">
        <article>
          <strong>20</strong>
          <span>distinct families</span>
        </article>
        <article>
          <strong>5</strong>
          <span>current routes</span>
        </article>
        <article>
          <strong>1,600</strong>
          <span>substantive native answers</span>
        </article>
        <article>
          <strong>100/100</strong>
          <span>route-family cells below half</span>
        </article>
      </div>

      <div className="verified-rule comparison-rule">
        <CheckCircle2 size={22} />
        <p>
          <b>Read by row, not as a leaderboard.</b> Each family uses its own generator and disclosed hard
          setting. A 31% parity score and a 31% turn-count score do not define equal latent difficulty.
        </p>
      </div>

      <div className="comparison-matrix-scroll">
        <div className="comparison-matrix" role="table" aria-label="Five-route family accuracy matrix">
          <div className="comparison-matrix-row comparison-matrix-head" role="row">
            <span role="columnheader">Family · frozen setting</span>
            {routeIds.map((modelId) => (
              <span role="columnheader" title={modelId} key={modelId}>
                {shortModel(modelId)}
              </span>
            ))}
            <span role="columnheader">Control floor</span>
          </div>
          {families.map((family, index) => {
            const mode = failureModesById.get(family.catalogueId);
            const routes = currentFamilyRoutes(family);
            return (
              <div className="comparison-matrix-row" role="row" key={family.planId}>
                <div className="comparison-family-cell" role="rowheader">
                  <span>
                    {String(index + 1).padStart(2, "0")} · {family.modality}
                  </span>
                  <Link href={`/failure/${family.catalogueId}`}>
                    {mode?.shortTitle ?? family.catalogueId} <ArrowUpRight size={13} />
                  </Link>
                  <small>difficulty {family.difficultySetting.label}</small>
                </div>
                {routeIds.map((modelId) => {
                  const route = routes.find((candidate) => candidate.modelId === modelId)!;
                  const rate = route.native.correct / route.native.substantiveAnswers;
                  return (
                    <div className="comparison-score-cell" role="cell" key={modelId}>
                      <strong>
                        {route.native.correct}/{route.native.substantiveAnswers}
                      </strong>
                      <span>{percent(rate)}</span>
                      <i aria-hidden="true">
                        <b style={{ width: `${rate * 200}%` }} />
                      </i>
                    </div>
                  );
                })}
                <div className="comparison-control-cell" role="cell">
                  <strong>{percent(weakestControlRate(family)!)}</strong>
                  <span>weakest of five</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="verified-caveat comparison-caveat">
        <p>
          These are observed boundary points, not complete difficulty curves. Full curves require newly frozen
          cases at several family-local settings; fitting them after looking at these holdouts would turn
          confirmation back into discovery. Human solvability also remains unverified.
        </p>
        <Link href="/evidence/five-route-matrix.json">Download the machine-readable matrix</Link>
        <Link href="/verified">Read the conservative hardness analysis</Link>
        <Link href="/human-study">Open the blinded human instrument</Link>
      </div>
    </section>
  );
}
