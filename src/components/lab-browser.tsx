"use client";

import { useState } from "react";
import { failureModes } from "@/lib/catalogue";
import type { GeneratorKey } from "@/lib/types";
import { DiagnosticLab } from "./diagnostic-lab";

const modes = failureModes.filter((mode) => mode.generator);

export function LabBrowser() {
  const [selected, setSelected] = useState(modes[0]!);
  return (
    <div className="lab-browser">
      <div className="lab-selector" aria-label="Diagnostic generator">
        {modes.map((mode) => (
          <button key={mode.id} aria-pressed={selected.id === mode.id} onClick={() => setSelected(mode)}>
            <span>{String(mode.index).padStart(2, "0")}</span>
            <b>{mode.shortTitle}</b>
            <small>{mode.modalities.join(" · ")}</small>
          </button>
        ))}
      </div>
      <div className="lab-workbench">
        <div className="lab-workbench-heading">
          <p className="eyebrow">Active instrument</p>
          <h2>{selected.title}</h2>
          <p>{selected.subtitle}</p>
        </div>
        <DiagnosticLab generator={selected.generator as GeneratorKey} roomy />
      </div>
    </div>
  );
}
