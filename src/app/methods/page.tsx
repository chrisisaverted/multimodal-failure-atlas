import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";

export const metadata: Metadata = { title: "Methods" };

const evidence = [
  ["Literature-established", "A primary source reports the behavioral pattern with a documented protocol."],
  [
    "Behavioral evidence",
    "Controlled outputs support a repeatable phenomenon but do not identify its internal cause.",
  ],
  [
    "Causal intervention",
    "A targeted manipulation changes the failure while relevant alternatives are held constant.",
  ],
  [
    "Representation evidence",
    "Probes or activation interventions locate information at a particular internal stage.",
  ],
  ["Hypothesis", "A mechanism is plausible and testable, but current evidence does not establish it."],
] as const;

export default function MethodsPage() {
  return (
    <>
      <section className="section-shell page-section methods-hero">
        <header className="page-header">
          <p className="eyebrow">Methods · version 0.1</p>
          <h1>
            Failure is an observation.
            <br />
            <em>Cause must be earned.</em>
          </h1>
          <p>
            The atlas separates what a model did, where the earliest error appeared, and what internal
            mechanism might explain it.
          </p>
        </header>
        <div className="method-flow">
          {[
            ["01", "Generate", "Sample a preregistered family, not a hand-picked miss."],
            ["02", "Counterbalance", "Break correlations between answer and surface form."],
            ["03", "Intervene", "Change exactly one capability-bearing latent variable."],
            ["04", "Localize", "Replace acquisition, representation, reasoning, or decoding in turn."],
            ["05", "Report", "Publish denominators, uncertainty, raw responses, and costs."],
          ].map(([n, title, copy], i) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              {i < 4 && <ArrowDown size={17} />}
            </div>
          ))}
        </div>
      </section>
      <section className="dark-section">
        <div className="section-shell">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Evidence ladder</p>
              <h2>
                Labels that resist
                <br />a good story
              </h2>
            </div>
            <p>
              A black-box model can support strong behavioral conclusions. Architectural claims require
              stronger access and stronger interventions.
            </p>
          </div>
          <div className="evidence-ladder">
            {evidence.map(([title, copy], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-shell methods-copy">
        <div>
          <p className="eyebrow">First-error priority</p>
          <h2>Find the earliest broken link.</h2>
        </div>
        <div className="prose-columns">
          <p>
            An incorrect final answer can originate in media acquisition, tokenization, perception, memory,
            reasoning, evidence reliance, or language decoding. Later mistakes do not establish earlier ones.
          </p>
          <p>
            We therefore substitute one stage at a time: expose the critical frame, provide a crop, probe the
            encoder, textualize the visual facts, or change only the output format. The first successful
            substitution narrows the causal location.
          </p>
          <p>
            Closed APIs constrain attribution. In those cases the atlas reports observable invariances and
            sensitivity surfaces, and labels architectural explanations as hypotheses.
          </p>
        </div>
      </section>
    </>
  );
}
