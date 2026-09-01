import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FlaskConical, GitCompareArrows, ShieldQuestion } from "lucide-react";
import { failureModes, failureModesById, humanize } from "@/lib/catalogue";
import { citationsById } from "@/lib/sources";
import { DiagnosticLab } from "@/components/diagnostic-lab";
import { EvidenceChip } from "@/components/evidence-chip";
import { PipelineMap } from "@/components/pipeline-map";
import { CapabilityCurve } from "@/components/capability-curve";
import { ResultMatrix } from "@/components/result-matrix";
import { PrecisionWireResultsPanel } from "@/components/precision-wire-results-panel";

type FailurePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return failureModes.map(({ id }) => ({ slug: id }));
}

export async function generateMetadata({ params }: FailurePageProps): Promise<Metadata> {
  const { slug } = await params;
  const mode = failureModesById.get(slug);
  return mode ? { title: mode.shortTitle, description: mode.subtitle } : {};
}

export default async function FailurePage({ params }: FailurePageProps) {
  const { slug } = await params;
  const mode = failureModesById.get(slug);
  if (!mode) notFound();
  const sources = mode.sourceIds.map((id) => citationsById.get(id)).filter(Boolean);

  return (
    <article className={`exhibit accent-${mode.accent}`}>
      <header className="exhibit-header section-shell">
        <Link className="back-link" href="/taxonomy">
          <ArrowLeft size={15} /> Atlas index
        </Link>
        <div className="exhibit-number">EXHIBIT {String(mode.index).padStart(2, "0")}</div>
        <div className="exhibit-title">
          <p>{mode.shortTitle}</p>
          <h1>{mode.title}</h1>
          <div>
            <EvidenceChip level={mode.evidence} />
            <span>{mode.reproducibility} reproducibility</span>
          </div>
        </div>
        <p className="exhibit-deck">{mode.subtitle}</p>
        <div className="tag-row">
          {[...mode.modalities, ...mode.capabilities].map((tag) => (
            <span key={tag}>{humanize(tag)}</span>
          ))}
        </div>
      </header>

      {mode.id === "identity-conditioned-exact-counting" ? (
        <PrecisionWireResultsPanel />
      ) : mode.generator ? (
        <section className="section-shell exhibit-lab-section">
          <div className="section-intro">
            <p className="eyebrow">Generate a specimen</p>
            <h2>
              Try the question before
              <br />
              you reveal its state.
            </h2>
            <p>
              Every visible property below is produced from the displayed seed. No model response is required
              to establish the answer.
            </p>
          </div>
          <DiagnosticLab generator={mode.generator} roomy />
        </section>
      ) : (
        <section className="section-shell generator-pending">
          <FlaskConical size={32} />
          <div>
            <p className="eyebrow">Instrument in development</p>
            <h2>This entry is literature-backed; its controlled generator has not yet passed validation.</h2>
            <p>The atlas shows no synthetic specimen rather than presenting an unverified diagnostic.</p>
          </div>
        </section>
      )}

      <section className="section-shell anatomy-section">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Failure anatomy</p>
            <h2>
              Where the evidence
              <br />
              may disappear
            </h2>
          </div>
          <p>
            The highlighted locations are hypotheses or attribution classes, not claims about every affected
            architecture.
          </p>
        </div>
        <PipelineMap active={mode.stages} />
        <div className="anatomy-grid">
          <article>
            <span>Trigger</span>
            <p>{mode.trigger}</p>
          </article>
          <article>
            <span>Observed symptom</span>
            <p>{mode.symptom}</p>
          </article>
          <article>
            <span>Violated expectation</span>
            <p>{mode.violatedExpectation}</p>
          </article>
          <article className="mechanism-card">
            <span>Proposed mechanism</span>
            <p>{mode.mechanism}</p>
            <EvidenceChip level={mode.evidence} />
          </article>
        </div>
      </section>

      <section className="evidence-section">
        <div className="section-shell evidence-grid">
          <div>
            <p className="eyebrow">Measure a boundary</p>
            <h2>
              Not “can it fail?”
              <br />
              But “where?”
            </h2>
            <p>
              Scored runs report frozen sample counts and confidence intervals. The current pilot measures
              one fixed difficulty point; the curve remains illustrative until a precommitted sweep exists.
            </p>
          </div>
          <CapabilityCurve color={mode.accent === "cobalt" ? "#2356c7" : "#f04b32"} />
        </div>
      </section>

      <section className="section-shell result-section">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Versioned model evidence</p>
            <h2>Absence stays visible.</h2>
          </div>
          <p>
            Only immutable, provenance-complete runs enter this matrix. Every score must carry its denominator
            and uncertainty.
          </p>
        </div>
        <ResultMatrix affectedModels={mode.affectedModels} failureModeId={mode.id} />
      </section>

      <section className="section-shell diagnosis-section">
        <div className="diagnosis-grid">
          <div>
            <ShieldQuestion size={24} />
            <p className="eyebrow">Alternative explanations</p>
            <ul>
              {mode.alternatives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <GitCompareArrows size={24} />
            <p className="eyebrow">What would disconfirm it?</p>
            <p>{mode.disconfirmingTest}</p>
          </div>
          <div>
            <FlaskConical size={24} />
            <p className="eyebrow">Possible mitigations</p>
            <ul>
              {mode.mitigations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-shell citations-section">
        <div className="section-heading">
          <p className="eyebrow">Primary evidence</p>
          <h2>Read past the label.</h2>
        </div>
        <div className="citation-list">
          {sources.map(
            (source, index) =>
              source && (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{source.title}</b>
                    <p>{source.note}</p>
                    <small>
                      {source.authors} · {source.year} · retrieved {source.retrieved}
                    </small>
                  </div>
                  <ArrowUpRight size={18} />
                </a>
              ),
          )}
        </div>
      </section>
    </article>
  );
}
