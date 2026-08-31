import Link from "next/link";
import { ArrowUpRight, ImageIcon, Video } from "lucide-react";
import type { FailureMode } from "@/lib/types";
import { EvidenceChip } from "./evidence-chip";

export function FailureCard({ mode, compact = false }: { mode: FailureMode; compact?: boolean }) {
  return (
    <article className={`failure-card accent-${mode.accent} ${compact ? "compact" : ""}`}>
      <div className="failure-card-top">
        <span className="failure-index">{String(mode.index).padStart(2, "0")}</span>
        <span className="modality-icons" aria-label={mode.modalities.join(", ")}>
          {mode.modalities.some((item) => item === "video" || item === "audiovisual") ? (
            <Video size={16} />
          ) : (
            <ImageIcon size={16} />
          )}
        </span>
      </div>
      <div>
        <p className="failure-kicker">{mode.shortTitle}</p>
        <h3>{mode.title}</h3>
        <p className="failure-subtitle">{mode.subtitle}</p>
      </div>
      <div className="failure-card-bottom">
        <EvidenceChip level={mode.evidence} />
        {mode.generator && <span className="generator-available">Live generator</span>}
        <Link href={`/failure/${mode.id}`} aria-label={`Explore ${mode.title}`}>
          <ArrowUpRight size={19} />
        </Link>
      </div>
    </article>
  );
}
