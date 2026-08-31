import type { Metadata } from "next";
import { FlaskConical, LockKeyhole, Search, Users } from "lucide-react";
import manifest from "../../../public/evaluations/lattice-counting-discovery-v1/manifest.json";
import { HumanBaselineLab } from "@/components/human-baseline-lab";

export const metadata: Metadata = { title: "Adaptive discovery" };

const selfTestCases = manifest.cases
  .filter((_, index) => index % 6 === 0)
  .map((item) => ({
    candidateId: item.candidateId,
    artifactPath: `/${item.artifact.replace(/^public\//, "")}`,
    question: item.question,
    answerOptions: item.answerOptions,
    expectedAnswer: item.expectedAnswer,
    count: item.parameters.count,
  }));

export default function DiscoveryPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <>
      <section className="section-shell page-section discovery-hero">
        <header className="page-header">
          <p className="eyebrow">Adaptive discovery · protocol v1</p>
          <h1>
            Search for the boundary.
            <br />
            <em>Then lock the test.</em>
          </h1>
          <p>
            Forty-eight frozen videos map where short repeated events disappear or become hard to count.
            Model-guided discovery and untouched confirmation are kept structurally separate.
          </p>
        </header>
        <div className="discovery-protocol-grid">
          <article>
            <Search />
            <span>01 · Discover</span>
            <h2>12 parameter cells</h2>
            <p>Duration × interval × sampling phase, each tested at four odd-numbered counts.</p>
          </article>
          <article>
            <FlaskConical />
            <span>02 · Select</span>
            <h2>Wrong answers only</h2>
            <p>Silence never earns hardness. A conservative cross-model score chooses two cells.</p>
          </article>
          <article>
            <LockKeyhole />
            <span>03 · Confirm</span>
            <h2>Untouched holdout</h2>
            <p>Even counts, new appearances, and disjoint seeds are reserved before screening.</p>
          </article>
          <article>
            <Users />
            <span>04 · Validate</span>
            <h2>Humans still matter</h2>
            <p>No specimen is called human-easy until a blinded baseline establishes it.</p>
          </article>
        </div>
      </section>

      <section className="dark-section discovery-status-section">
        <div className="section-shell discovery-status-grid">
          <div>
            <p className="eyebrow">The initial hypothesis</p>
            <h2>Aliasing tomography for black-box video systems</h2>
          </div>
          <div>
            <p>
              Moving identical flashes through temporal phase can reveal an effective acquisition boundary
              without claiming access to a provider&apos;s hidden preprocessing. Recovery under denser frames,
              slow motion, or timestamped evidence would then localize the loss more strongly.
            </p>
            <p>
              This first grid is exploratory. Its selected cells will never be used as unbiased evidence; only
              the subsequently frozen holdout can support confirmation.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell baseline-section">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Blinded self-test · local only</p>
            <h2>
              Can you count
              <br />
              what the models miss?
            </h2>
          </div>
          <p>
            Try eight discovery specimens before seeing their answers. Results stay in your browser and can be
            exported. This checks the instrument; it is not yet a research-grade human baseline.
          </p>
        </div>
        <HumanBaselineLab cases={selfTestCases} basePath={basePath} />
      </section>
    </>
  );
}
