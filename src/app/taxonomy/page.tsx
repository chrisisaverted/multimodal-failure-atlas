import type { Metadata } from "next";
import { TaxonomyExplorer } from "@/components/taxonomy-explorer";
import { failureModes } from "@/lib/catalogue";
import { admittedEvidence } from "@/lib/admitted-evidence";

export const metadata: Metadata = { title: "Atlas" };

export default function TaxonomyPage() {
  return (
    <section className="section-shell page-section">
      <header className="page-header">
        <p className="eyebrow">
          The living index · {failureModes.length} families · {admittedEvidence.families.length} reproduced
          here
        </p>
        <h1>
          Every failure has
          <br />
          <em>an anatomy.</em>
        </h1>
        <p>
          Filter by modality and evidence strength. Generator-backed exhibits can be reproduced now;
          literature entries identify the next diagnostic instruments to build.
        </p>
      </header>
      <TaxonomyExplorer />
    </section>
  );
}
