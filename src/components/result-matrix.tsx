import Link from "next/link";
import { DatabaseZap } from "lucide-react";

export function ResultMatrix({ affectedModels }: { affectedModels?: string }) {
  return (
    <div className="result-matrix" aria-label="Verified model result matrix">
      <div className="result-matrix-head">
        <span>Model snapshot</span>
        <span>Input condition</span>
        <span>Accuracy · 95% CI</span>
        <span>Samples</span>
      </div>
      <div className="result-matrix-empty">
        <DatabaseZap size={25} aria-hidden="true" />
        <p>
          <b>No verified runs for this family.</b>
          Empty means unevaluated—not zero accuracy. Fixtures and illustrative curves are excluded.
        </p>
        <Link href="/methods">Read the admission standard</Link>
      </div>
      <p className="affected-model-scope">
        <span>Affected-model scope</span>
        {affectedModels ?? "No current cross-model affected set has been established."}
      </p>
    </div>
  );
}
