import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { citations } from "@/lib/sources";

export const metadata: Metadata = { title: "Research Library" };

export default function ResearchPage() {
  return (
    <section className="section-shell page-section">
      <header className="page-header">
        <p className="eyebrow">Research library · {citations.length} primary or official sources</p>
        <h1>
          The evidence
          <br />
          <em>behind the exhibits.</em>
        </h1>
        <p>
          This is a curated starting set, not a claim of completeness. Stable paper links, scope notes, and
          retrieval dates make every atlas claim traceable.
        </p>
      </header>
      <div className="research-list">
        {citations
          .sort((a, b) => b.year - a.year)
          .map((source, index) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span className="research-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p>
                  {source.year}
                  {source.venue ? ` · ${source.venue}` : ""}
                </p>
                <h2>{source.title}</h2>
                <span>{source.authors}</span>
                <small>{source.note}</small>
              </div>
              <ArrowUpRight size={20} />
            </a>
          ))}
      </div>
    </section>
  );
}
