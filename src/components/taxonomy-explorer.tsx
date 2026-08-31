"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { failureModes, humanize, modalities } from "@/lib/catalogue";
import type { EvidenceLevel, Modality } from "@/lib/types";
import { FailureCard } from "./failure-card";

const evidenceOptions: EvidenceLevel[] = [
  "literature-established",
  "representation-evidence",
  "behavioral-evidence",
  "hypothesis",
  "speculative",
];

export function TaxonomyExplorer({ condensed = false }: { condensed?: boolean }) {
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState<Modality | "all">("all");
  const [evidence, setEvidence] = useState<EvidenceLevel | "all">("all");

  const results = useMemo(
    () =>
      failureModes.filter((mode) => {
        const haystack = [mode.title, mode.shortTitle, mode.subtitle, ...mode.stages, ...mode.capabilities]
          .join(" ")
          .toLowerCase();
        return (
          (!query || haystack.includes(query.toLowerCase())) &&
          (modality === "all" || mode.modalities.includes(modality)) &&
          (evidence === "all" || mode.evidence === evidence)
        );
      }),
    [evidence, modality, query],
  );

  const clear = () => {
    setQuery("");
    setModality("all");
    setEvidence("all");
  };

  return (
    <div className="taxonomy-explorer">
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">Search failure modes</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the atlas"
          />
        </label>
        <label>
          <span className="sr-only">Filter by modality</span>
          <select value={modality} onChange={(event) => setModality(event.target.value as Modality | "all")}>
            <option value="all">All modalities</option>
            {modalities.map((item) => (
              <option key={item} value={item}>
                {humanize(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by evidence</span>
          <select
            value={evidence}
            onChange={(event) => setEvidence(event.target.value as EvidenceLevel | "all")}
          >
            <option value="all">All evidence levels</option>
            {evidenceOptions.map((item) => (
              <option key={item} value={item}>
                {humanize(item)}
              </option>
            ))}
          </select>
        </label>
        <span className="filter-count">
          <SlidersHorizontal size={15} /> {results.length} of {failureModes.length}
        </span>
        {(query || modality !== "all" || evidence !== "all") && (
          <button className="clear-filter" onClick={clear}>
            <X size={14} /> Clear
          </button>
        )}
      </div>
      <div className={`failure-grid ${condensed ? "condensed" : ""}`}>
        {results.map((mode) => (
          <FailureCard key={mode.id} mode={mode} compact={condensed} />
        ))}
      </div>
      {results.length === 0 && (
        <div className="empty-state">
          <p>No exhibits match those filters.</p>
          <button onClick={clear}>Reset the atlas</button>
        </div>
      )}
    </div>
  );
}
