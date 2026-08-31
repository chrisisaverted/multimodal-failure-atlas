"use client";

import type { CSSProperties } from "react";
import type { DiagnosticInstance } from "@/lib/types";
import { Shape } from "./shape";

const palette: Record<string, string> = {
  cobalt: "#2356c7",
  vermillion: "#f04b32",
  violet: "#8062d6",
  teal: "#168e88",
  cream: "#f1eee4",
  ink: "#171915",
  citron: "#d9f43c",
  blue: "#2356c7",
  red: "#f04b32",
};

const number = (value: unknown) => Number(value);

export function DiagnosticVisual({
  instance,
  playhead = 0,
}: {
  instance: DiagnosticInstance;
  playhead?: number;
}) {
  const latent = instance.latent;
  switch (instance.generator) {
    case "small-object": {
      const distractors = Array.from({ length: number(latent.distractors) }, (_, index) => ({
        x: 8 + ((index * 29 + instance.seed * 7) % 84),
        y: 10 + ((index * 47 + instance.seed * 11) % 80),
        size: 2 + (index % 4),
      }));
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 100 100"
          role="img"
          aria-label="A field of neutral marks with one tiny coloured target"
        >
          <rect width="100" height="100" fill={palette.cream} />
          {distractors.map((dot, index) => (
            <circle key={index} cx={dot.x} cy={dot.y} r={dot.size / 2} fill="#aaa99f" opacity=".48" />
          ))}
          <Shape
            kind={String(latent.target)}
            fill={palette[String(latent.targetColor)]!}
            x={number(latent.x)}
            y={number(latent.y)}
            size={Math.max(2.4, number(latent.size) / 2)}
          />
        </svg>
      );
    }
    case "patch-phase": {
      const offset = number(latent.offset);
      const separation = number(latent.separation);
      const strokeWidth = number(latent.strokeWidth);
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="Two outlined circles over a reference patch grid"
        >
          <rect width="140" height="100" fill={palette.cream} />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 14} x2={i * 14} y1="0" y2="100" stroke="#171915" opacity=".08" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} y1={i * 14} y2={i * 14} x1="0" x2="140" stroke="#171915" opacity=".08" />
          ))}
          <circle
            cx={42 + offset}
            cy="50"
            r="20"
            fill="none"
            stroke={palette.cobalt}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={42 + offset + separation}
            cy="50"
            r="20"
            fill="none"
            stroke={palette.vermillion}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }
    case "attribute-binding": {
      const items = latent.shapes as string[];
      const itemColors = latent.colors as string[];
      const itemSize = number(latent.itemSize);
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="Four differently coloured shapes"
        >
          <rect width="140" height="100" fill={palette.cream} />
          {items.map((shape, index) => (
            <Shape
              key={shape}
              kind={shape}
              fill={palette[itemColors[index]!]!}
              x={25 + index * 30}
              y={50 + (index % 2 ? 7 : -5)}
              size={itemSize}
            />
          ))}
        </svg>
      );
    }
    case "numerosity-density": {
      const count = number(latent.count);
      const radius = number(latent.radius) * 0.7;
      const spread = number(latent.spread);
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label={`${count} violet circles`}
        >
          <rect width="140" height="100" fill={palette.cream} />
          {Array.from({ length: count }, (_, index) => {
            const angle = (index / count) * Math.PI * 2 + instance.seed * 0.1;
            const ring = spread * (0.65 + (index % 3) * 0.18);
            return (
              <circle
                key={index}
                cx={70 + Math.cos(angle) * ring}
                cy={50 + Math.sin(angle) * ring}
                r={radius}
                fill={palette.violet}
                stroke={palette.cream}
                strokeWidth="1"
              />
            );
          })}
        </svg>
      );
    }
    case "brief-event": {
      const duration = number(latent.videoDurationMs);
      const time = playhead * duration;
      const active =
        Boolean(latent.eventPresent) &&
        time >= number(latent.eventStartMs) &&
        time <= number(latent.eventStartMs) + number(latent.durationMs);
      return (
        <VideoStage label="A ball crosses the frame" playhead={playhead}>
          <circle
            cx={12 + playhead * 116}
            cy={50 + Math.sin(playhead * Math.PI * 4) * 22}
            r="8"
            fill={active ? palette.violet : palette.cobalt}
          />
        </VideoStage>
      );
    }
    case "event-order": {
      const time = playhead * number(latent.videoDurationMs);
      const order = latent.order as string[];
      const first = Math.abs(time - number(latent.firstAtMs)) < 300;
      const second = Math.abs(time - number(latent.secondAtMs)) < 300;
      return (
        <VideoStage label="Two shapes flash in sequence" playhead={playhead}>
          <Shape
            kind="square"
            fill={
              (first && order[0] === "square") || (second && order[1] === "square")
                ? palette.citron
                : "#b7b5ab"
            }
            x={42}
            y={50}
            size={20}
          />
          <Shape
            kind="circle"
            fill={
              (first && order[0] === "circle") || (second && order[1] === "circle")
                ? palette.vermillion
                : "#b7b5ab"
            }
            x={98}
            y={50}
            size={20}
          />
        </VideoStage>
      );
    }
    case "identity-occlusion": {
      const t = playhead;
      const halfWindow = number(latent.occlusionHalfWindow);
      const behind = Math.abs(t - 0.5) < halfWindow;
      const progress = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
      const blueY = t < 0.5 ? 34 : Boolean(latent.swap) ? 67 : 33;
      const redY = t < 0.5 ? 66 : Boolean(latent.swap) ? 33 : 67;
      const x = t < 0.5 ? 10 + progress * 60 : 70 + progress * 60;
      return (
        <VideoStage label="Two balls pass behind an occluder" playhead={playhead}>
          {!behind && (
            <>
              <circle cx={x} cy={blueY} r="7" fill={palette.blue} />
              <circle cx={x} cy={redY} r="7" fill={palette.red} />
            </>
          )}
          <rect x="58" y="13" width="24" height="74" rx="3" fill="#252821" />
        </VideoStage>
      );
    }
    case "event-counting": {
      const time = playhead * number(latent.videoDurationMs);
      const count = number(latent.count);
      const interval = number(latent.intervalMs);
      const firstFlashAtMs = number(latent.firstFlashAtMs ?? 700);
      const active = Array.from({ length: count }, (_, i) => firstFlashAtMs + i * interval).some(
        (start) => time >= start && time < start + number(latent.flashDurationMs),
      );
      return (
        <VideoStage label="A central light flashes repeatedly" playhead={playhead}>
          <circle cx="70" cy="50" r="22" fill={active ? palette.citron : "#35382f"} />
          <circle
            cx="70"
            cy="50"
            r="30"
            fill="none"
            stroke={active ? palette.citron : "#6d6f66"}
            opacity={active ? 0.45 : 0.2}
            strokeWidth="2"
          />
        </VideoStage>
      );
    }
  }
}

function VideoStage({
  children,
  playhead,
  label,
}: {
  children: React.ReactNode;
  playhead: number;
  label: string;
}) {
  return (
    <div className="video-stage" role="img" aria-label={label}>
      <svg className="diagnostic-svg" viewBox="0 0 140 100">
        <rect width="140" height="100" fill="#e8e5da" />
        <path d="M0 82 H140" stroke="#171915" opacity=".12" />
        {children}
      </svg>
      <div className="video-progress">
        <span style={{ "--progress": `${playhead * 100}%` } as CSSProperties} />
      </div>
    </div>
  );
}
