import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="section-shell page-section about-page">
      <header className="page-header">
        <p className="eyebrow">About the atlas</p>
        <h1>
          A public memory
          <br />
          <em>for model blind spots.</em>
        </h1>
        <p>
          Benchmarks become saturated. APIs change beneath stable names. A failure discovered once becomes an
          anecdote. This project turns those anecdotes into versioned, renewable scientific instruments.
        </p>
      </header>
      <div className="about-grid">
        <article>
          <span>01</span>
          <h2>Why it exists</h2>
          <p>
            Aggregate scores conceal qualitatively different failures. We want visitors to see the actual
            stimulus, understand the violated expectation, and distinguish behavioral evidence from an
            attractive causal story.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>What “live” means</h2>
          <p>
            Public seeds produce fresh educational examples. Private, precommitted seeds support scored runs.
            Future models are allowed to pass; the historical curve remains.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>How to contribute</h2>
          <p>
            A contribution needs a falsifiable claim, deterministic generator or redistribution-safe evidence,
            balanced ground truth, controls, citations, and a disconfirming test.
          </p>
        </article>
        <article>
          <span>04</span>
          <h2>What it refuses</h2>
          <p>
            No fabricated model outputs. No single-example rankings. No architectural certainty about
            black-box systems. No generated media whose ground truth cannot be verified.
          </p>
        </article>
      </div>
      <div className="about-cta">
        <p className="eyebrow">Begin with the evidence</p>
        <h2>See the field guide in action.</h2>
        <div>
          <Link className="button-primary" href="/lab">
            Open the live lab <ArrowRight size={16} />
          </Link>
          <Link className="text-link" href="/research">
            Browse sources
          </Link>
        </div>
      </div>
    </section>
  );
}
