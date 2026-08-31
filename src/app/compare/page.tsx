import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { CapabilityCurve } from "@/components/capability-curve";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <section className="section-shell page-section">
      <header className="page-header">
        <p className="eyebrow">Comparison room</p>
        <h1>
          Curves before
          <br />
          <em>rankings.</em>
        </h1>
        <p>
          The atlas compares where models cross a capability boundary—not who wins a tiny pile of
          hand-selected questions.
        </p>
      </header>
      <div className="compare-preview">
        <div>
          <p className="eyebrow">Illustrative only</p>
          <h2>Brief-event detection threshold</h2>
          <p>
            A valid comparison holds media encoding and prompt constant, preregisters a seed set, and shows
            uncertainty over repeated trials.
          </p>
          <CapabilityCurve color="#2356c7" label="Schema preview — no model data" />
        </div>
        <div className="compare-empty">
          <BarChart3 size={34} />
          <h3>No verified comparison yet</h3>
          <p>
            The visualization is ready; model series stay absent until a run passes provenance and sample-size
            checks.
          </p>
          <Link href="/methods">
            Read the run standard <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
