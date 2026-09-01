import type { Metadata } from "next";
import { LabBrowser } from "@/components/lab-browser";
import { ReferenceArtifacts } from "@/components/reference-artifacts";
import admittedFamilies from "@/data/admitted-families.json";

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
          These are educational specimens, not scored leaderboard samples. “Verified family” means the family
          has separate frozen five-route evidence; every freshly generated specimen remains unscored. Adjust
          controlled factors, inspect exact latent state, and download reproduction metadata.
        </p>
      </header>
      <LabBrowser admittedIds={admittedFamilies.families.map((family) => family.catalogueId)} />
      <ReferenceArtifacts />
    </section>
  );
}
