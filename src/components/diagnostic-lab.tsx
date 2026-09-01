"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ImageDown, Pause, Play, RefreshCw, RotateCcw } from "lucide-react";
import { defaultDiagnosticParams, generateInstance, generatorVersion } from "@/lib/generators";
import type { GeneratorKey } from "@/lib/types";
import { DiagnosticVisual } from "./diagnostic-visual";

const videoKeys = new Set<GeneratorKey>([
  "brief-event",
  "event-order",
  "identity-occlusion",
  "event-counting",
  "gated-frequency",
  "gated-pair-collision",
  "route-turn-integration",
  "target-transition-count",
  "sequential-swap-tracking",
  "signed-state-accumulation",
]);

export function DiagnosticLab({ generator, roomy = false }: { generator: GeneratorKey; roomy?: boolean }) {
  const [params, setParams] = useState(defaultDiagnosticParams);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(videoKeys.has(generator));
  const [playhead, setPlayhead] = useState(0);
  const playheadRef = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const instance = useMemo(() => generateInstance(generator, params), [generator, params]);
  const isVideo = videoKeys.has(generator);

  useEffect(() => {
    if (!isVideo || !playing) return;
    const duration = Number(instance.latent.videoDurationMs ?? 5000);
    const started = performance.now() - playheadRef.current * duration;
    const timer = window.setInterval(() => {
      const next = ((performance.now() - started) % duration) / duration;
      playheadRef.current = next;
      setPlayhead(next);
    }, 33);
    return () => window.clearInterval(timer);
  }, [instance.latent.videoDurationMs, isVideo, playing]);

  const regenerate = () => {
    setParams((current) => ({ ...current, seed: current.seed + 1, variant: current.variant + 1 }));
    playheadRef.current = 0;
    setRevealed(false);
    setPlayhead(0);
    setPlaying(isVideo);
  };

  const copyMetadata = async () => {
    await navigator.clipboard.writeText(JSON.stringify({ generatorVersion, ...instance }, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const downloadMetadata = () => {
    const blob = new Blob([JSON.stringify({ generatorVersion, ...instance }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${generator}-${params.seed}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadSpecimen = () => {
    const svg = canvasRef.current?.querySelector("svg");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${generator}-${params.seed}-${isVideo ? `frame-${Math.round(playhead * 1000)}` : "specimen"}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`diagnostic-lab ${roomy ? "roomy" : ""}`}>
      <div className="lab-toolbar">
        <div>
          <span className="status-dot" /> Generated now · seed {params.seed}
        </div>
        <div className="lab-toolbar-actions">
          <button onClick={copyMetadata} title="Copy reproducibility metadata">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <button onClick={downloadMetadata} title="Download metadata">
            <Download size={15} />
          </button>
          <button
            onClick={downloadSpecimen}
            title={isVideo ? "Download the current rendered video frame" : "Download the generated specimen"}
          >
            <ImageDown size={15} />
          </button>
        </div>
      </div>
      <div className="lab-canvas" ref={canvasRef}>
        <DiagnosticVisual instance={instance} playhead={playhead} />
        {isVideo && (
          <button
            className="play-button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Pause animation" : "Play animation"}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
        )}
      </div>
      <div className="lab-question">
        <p className="eyebrow">Question for human & model</p>
        <h3>{instance.question}</h3>
        <div className="answer-options">
          {instance.answerOptions?.map((option) => (
            <span key={option} className={revealed && option === instance.answer ? "correct" : ""}>
              {option}
            </span>
          ))}
        </div>
        <button className="reveal-button" onClick={() => setRevealed((value) => !value)} aria-live="polite">
          {revealed ? `Construction-grounded answer: ${instance.answer}` : "Reveal answer"}
        </button>
      </div>
      <div className="lab-controls">
        <label>
          <span>
            Difficulty <b>{params.difficulty}</b>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={params.difficulty}
            onChange={(event) =>
              setParams((current) => ({ ...current, difficulty: Number(event.target.value) }))
            }
          />
        </label>
        <label>
          <span>
            Phase / variant <b>{params.variant}</b>
          </span>
          <input
            type="range"
            min="0"
            max="13"
            value={params.variant}
            onChange={(event) => {
              setParams((current) => ({ ...current, variant: Number(event.target.value) }));
              playheadRef.current = 0;
              setPlayhead(0);
            }}
          />
        </label>
        <div className="control-buttons">
          <button onClick={regenerate}>
            <RefreshCw size={15} /> Fresh instance
          </button>
          {isVideo && (
            <button
              onClick={() => {
                playheadRef.current = 0;
                setPlayhead(0);
                setPlaying(true);
              }}
            >
              <RotateCcw size={15} /> Replay
            </button>
          )}
        </div>
      </div>
      <p className="minimal-pair">
        <span>Minimal-pair contract</span>
        {instance.minimalPairDescription}
      </p>
    </section>
  );
}
