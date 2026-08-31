import { humanize } from "@/lib/catalogue";
import type { PipelineStage } from "@/lib/types";

const fullPipeline: PipelineStage[] = [
  "acquisition",
  "preprocessing",
  "tokenization",
  "vision-encoding",
  "compression",
  "cross-modal-projection",
  "reasoning",
  "language-decoding",
];

export function PipelineMap({ active }: { active: PipelineStage[] }) {
  return (
    <div className="pipeline-map" aria-label="Possible location in the multimodal processing pipeline">
      {fullPipeline.map((stage, index) => (
        <div key={stage} className={active.includes(stage) ? "active" : ""}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <b>{humanize(stage)}</b>
        </div>
      ))}
    </div>
  );
}
