import type { EvidenceLevel } from "@/lib/types";
import { humanize } from "@/lib/catalogue";

export function EvidenceChip({ level }: { level: EvidenceLevel }) {
  return <span className={`evidence-chip evidence-${level}`}>{humanize(level)}</span>;
}
