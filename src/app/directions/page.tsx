import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";

export const metadata: Metadata = { title: "Research directions" };

const directions = [
  {
    title: "Sufficient-statistic interventions",
    question: "What is the smallest external state that restores exact video reasoning?",
    design:
      "Factor persistent trails, direction labels, intermediate states, and running counters across path length.",
  },
  {
    title: "Relevance-shift stress tests",
    question: "Are answer-critical visual tokens discarded before their relevance becomes knowable?",
    design:
      "Reveal a dense image’s target region early, late, or through a multi-hop visual reference while matching pixels.",
  },
  {
    title: "Sampling-lattice tomography",
    question: "Can phase sweeps recover a deployed route’s effective temporal acquisition pattern?",
    design:
      "Cross event duration and phase with explicit FPS, extracted-frame, slow-motion, and critical-frame controls.",
  },
  {
    title: "Recognition → update decomposition",
    question: "Do errors begin at event perception or at the next latent-state update?",
    design:
      "Probe event identity, pre-state, post-state, and final state on one-bit counterfactual video pairs.",
  },
  {
    title: "Cross-modal program transfer",
    question: "Can a rule learned only through video be queried reliably through language?",
    design:
      "Separate text-rule/text-event, text-rule/video-event, and video-only-rule splits in random micro-worlds.",
  },
  {
    title: "Latent simulation vs. text",
    question:
      "Does a nonlinguistic workspace improve physical counterfactual consistency at matched compute?",
    design:
      "Compare text scratchpads, diagrams, recurrent latent state, and external simulation on reversible worlds.",
  },
  {
    title: "Human-easy boundary curves",
    question: "Where is the stable region that remains easy for people and hard for every model route?",
    design:
      "Run blinded native-media, replay, and slow-motion conditions with case-level accuracy and response time.",
  },
  {
    title: "Sealed-panel adaptive discovery",
    question: "Does model-guided generation transfer, or merely overfit the development routes?",
    design:
      "Compare random, Bayesian, evolutionary, and RL search under equal budgets against untouched model routes.",
  },
] as const;

export default function DirectionsPage() {
  return (
    <section className="section-shell page-section directions-page">
      <header className="page-header">
        <p className="eyebrow">From failures to experiments</p>
        <h1>
          A research agenda,
          <br />
          <em>not a bug list.</em>
        </h1>
        <p>
          Eight falsifiable programs follow from the first 20 strict families. Each asks what intervention
          should move the boundary—and what outcome would prove the proposed mechanism wrong.
        </p>
      </header>

      <div className="direction-priority">
        <FlaskConical size={28} />
        <div>
          <p className="eyebrow">Recommended first paper</p>
          <h2>Sufficient-statistic intervention curves</h2>
          <p>
            Route turns, signed accumulation, and identity swaps already have low native accuracy, exact
            generators, and useful controls. A shared factorial design can isolate where state is lost while a
            blinded human study establishes the genuine human-model gap.
          </p>
        </div>
      </div>

      <div className="direction-grid">
        {directions.map((direction, index) => (
          <article key={direction.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{direction.title}</h2>
            <h3>{direction.question}</h3>
            <p>{direction.design}</p>
          </article>
        ))}
      </div>

      <div className="direction-links">
        <Link className="button-primary" href="/verified">
          Inspect the motivating evidence <ArrowRight size={17} />
        </Link>
        <Link className="text-link" href="/discovery">
          Try the blinded self-test
        </Link>
      </div>
    </section>
  );
}
