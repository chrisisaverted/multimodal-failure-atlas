import Link from "next/link";
import { ArrowDownRight, ArrowRight, CircleDot, ScanSearch } from "lucide-react";
import { failureModes } from "@/lib/catalogue";
import { citations } from "@/lib/sources";
import { FailureCard } from "@/components/failure-card";
import { DiagnosticLab } from "@/components/diagnostic-lab";
import { admittedEvidence, admittedRunCount } from "@/lib/admitted-evidence";

export default function Home() {
  const featured = failureModes.filter((mode) => mode.featured).slice(0, 4);
  const admittedImages = admittedEvidence.families.filter((family) => family.modality === "image").length;
  const admittedVideos = admittedEvidence.families.filter((family) => family.modality === "video").length;
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-label">
          <span>Field note № 001</span>
          <span>Updated 1 September 2026</span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">An atlas of machine perception</p>
          <h1>
            What falls through
            <br />
            <em>the gaps?</em>
          </h1>
          <p className="hero-deck">
            A living collection of image and video failures—generated fresh, measured as capability
            boundaries, and traced to the earliest point where evidence disappears.
          </p>
          <div className="hero-actions">
            <Link className="button-primary" href="/taxonomy">
              Enter the atlas <ArrowRight size={17} />
            </Link>
            <Link className="text-link" href="/methods">
              Read our evidence standard <ArrowDownRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-instrument" aria-hidden="true">
          <div className="orbit orbit-one">
            <span />
          </div>
          <div className="orbit orbit-two">
            <span />
          </div>
          <div className="orbit orbit-three">
            <span />
          </div>
          <div className="instrument-crosshair">
            <i />
            <i />
          </div>
          <p>
            OBSERVATION
            <br />
            IS NOT
            <br />
            UNDERSTANDING
          </p>
          <small>phase 07 / 14</small>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{admittedEvidence.families.length}</strong>
            <span>Strictly admitted families</span>
          </div>
          <div>
            <strong>
              {admittedImages} + {admittedVideos}
            </strong>
            <span>Image + video holdouts</span>
          </div>
          <div>
            <strong>{citations.length}</strong>
            <span>Primary sources</span>
          </div>
          <div>
            <strong>{admittedRunCount.toLocaleString("en-US")}</strong>
            <span>Published response records</span>
          </div>
        </div>
      </section>

      <section className="manifesto-strip">
        <span>Not a leaderboard.</span>
        <span>Not a gotcha reel.</span>
        <span>A map of where representation breaks.</span>
      </section>

      <section className="section-shell verified-callout">
        <div>
          <p className="eyebrow">Strict cross-model evidence</p>
          <h2>Twenty families survived the holdout.</h2>
          <p>
            For each family, Gemini, Qwen, and Kimi supplied at least 16 substantive native-media answers.
            Every observed solve rate stayed strictly below 50%; non-answers were excluded.
          </p>
        </div>
        <Link className="button-primary" href="/verified">
          Inspect all 20 results <ArrowRight size={17} />
        </Link>
      </section>

      <section className="section-shell featured-section">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Selected exhibits</p>
            <h2>
              Failures that expose
              <br />
              the architecture beneath
            </h2>
          </div>
          <p>
            Each exhibit is a family, not an anecdote. Change one latent factor, generate a fresh instance,
            and watch the boundary move.
          </p>
        </div>
        <div className="failure-grid featured-grid">
          {featured.map((mode) => (
            <FailureCard key={mode.id} mode={mode} />
          ))}
        </div>
        <Link className="wide-link" href="/taxonomy">
          <span>Browse all {failureModes.length} mapped families</span>
          <ArrowRight size={21} />
        </Link>
      </section>

      <section className="live-demo-section">
        <div className="section-shell live-demo-grid">
          <div className="live-demo-copy">
            <p className="eyebrow">Live specimen</p>
            <h2>A moment the model may never receive.</h2>
            <p>
              This five-second scene contains a controlled state change. Shorten its duration and shift its
              temporal phase: the semantic question stays fixed while the effective evidence can disappear.
            </p>
            <div className="mechanism-note">
              <ScanSearch size={22} />
              <div>
                <b>What this tests</b>
                <span>Acquisition and temporal compression—not general knowledge.</span>
              </div>
            </div>
            <Link className="text-link" href="/failure/brief-event-blindness">
              Open the full exhibit <ArrowRight size={16} />
            </Link>
          </div>
          <DiagnosticLab generator="brief-event" />
        </div>
      </section>

      <section className="section-shell principles-section">
        <div className="section-heading">
          <p className="eyebrow">Rules of observation</p>
          <h2>
            Fresh does not mean fair.
            <br />
            Failure does not explain itself.
          </h2>
        </div>
        <div className="principle-grid">
          <article>
            <span>01</span>
            <CircleDot />
            <h3>Generate families</h3>
            <p>
              One spectacular miss proves little. We sweep event duration, scale, phase, density, and
              occlusion to estimate capability curves.
            </p>
          </article>
          <article>
            <span>02</span>
            <CircleDot />
            <h3>Locate the first error</h3>
            <p>
              Acquisition, representation, projection, reasoning, and reporting failures demand different
              explanations and remedies.
            </p>
          </article>
          <article>
            <span>03</span>
            <CircleDot />
            <h3>Label uncertainty</h3>
            <p>
              Behavioral evidence is not mechanistic proof. Every explanation carries an explicit evidence
              tier and a disconfirming test.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
