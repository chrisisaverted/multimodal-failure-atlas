import type { Metadata } from "next";
import { LabBrowser } from "@/components/lab-browser";
import { ReferenceArtifacts } from "@/components/reference-artifacts";

export const metadata: Metadata = { title: "Live Lab" };

export default function LabPage() {
  return (
    <section className="section-shell page-section">
      <header className="page-header">
        <p className="eyebrow">Live laboratory · deterministic public seeds</p>
        <h1>
          Change one thing.
          <br />
          <em>Watch the boundary.</em>
        </h1>
        <p>
          These are educational specimens, not scored leaderboard samples. Adjust controlled factors, inspect
          exact latent state, and download reproduction metadata.
        </p>
      </header>
      <LabBrowser />
      <ReferenceArtifacts />
    </section>
  );
}
