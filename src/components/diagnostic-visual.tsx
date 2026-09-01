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
    case "dense-symmetry": {
      const gridSize = number(latent.gridSize);
      const bits = latent.panelBits as number[];
      const labels = ["A", "B", "C", "D"];
      const cellSize = 36 / gridSize;
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="Four dense panels for exact bilateral symmetry comparison"
        >
          <rect width="140" height="100" fill={palette.cream} />
          {labels.map((label, panel) => {
            const originX = panel % 2 === 0 ? 18 : 86;
            const originY = panel < 2 ? 5 : 54;
            const panelBits = bits.slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize);
            return (
              <g key={label}>
                <text x={originX - 7} y={originY + 21} fontSize="7" fontWeight="700" fill="#171915">
                  {label}
                </text>
                <rect
                  x={originX - 1}
                  y={originY - 1}
                  width="38"
                  height="38"
                  fill="#fffdf7"
                  stroke="#4b4e48"
                  strokeWidth=".6"
                />
                {panelBits.map((value, index) =>
                  value ? (
                    <rect
                      key={index}
                      x={originX + (index % gridSize) * cellSize}
                      y={originY + Math.floor(index / gridSize) * cellSize}
                      width={cellSize + 0.05}
                      height={cellSize + 0.05}
                      fill={panel % 2 === 0 ? palette.cobalt : palette.violet}
                    />
                  ) : null,
                )}
                <line
                  x1={originX + 18}
                  x2={originX + 18}
                  y1={originY - 1}
                  y2={originY + 37}
                  stroke="#f04b32"
                  strokeWidth=".45"
                  opacity=".75"
                />
              </g>
            );
          })}
        </svg>
      );
    }
    case "dense-xor": {
      const gridSize = number(latent.gridSize);
      const inputA = latent.inputA as number[];
      const inputB = latent.inputB as number[];
      const candidates = latent.candidateBits as number[];
      const renderGrid = (bits: number[], originX: number, originY: number, side: number, key: string) => {
        const cellSize = side / gridSize;
        return (
          <g key={key}>
            <rect
              x={originX - 0.7}
              y={originY - 0.7}
              width={side + 1.4}
              height={side + 1.4}
              fill="#fffdf7"
              stroke="#4b4e48"
              strokeWidth=".55"
            />
            {bits.map((value, index) =>
              value ? (
                <rect
                  key={index}
                  x={originX + (index % gridSize) * cellSize}
                  y={originY + Math.floor(index / gridSize) * cellSize}
                  width={cellSize + 0.04}
                  height={cellSize + 0.04}
                  fill={palette.cobalt}
                />
              ) : null,
            )}
          </g>
        );
      };
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="Two input bit grids and four candidate XOR outputs"
        >
          <rect width="140" height="100" fill={palette.cream} />
          <text x="40" y="6" textAnchor="middle" fontSize="4.5" fontWeight="700">
            INPUT 1
          </text>
          <text x="100" y="6" textAnchor="middle" fontSize="4.5" fontWeight="700">
            INPUT 2
          </text>
          {renderGrid(inputA, 28, 10, 24, "input-a")}
          {renderGrid(inputB, 88, 10, 24, "input-b")}
          <text x="70" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill={palette.vermillion}>
            XOR
          </text>
          {["A", "B", "C", "D"].map((label, panel) => {
            const originX = 6 + panel * 34;
            const panelBits = candidates.slice(
              panel * gridSize * gridSize,
              (panel + 1) * gridSize * gridSize,
            );
            return (
              <g key={label}>
                <text x={originX + 12} y="56" textAnchor="middle" fontSize="5" fontWeight="700">
                  {label}
                </text>
                {renderGrid(panelBits, originX, 61, 24, `candidate-${label}`)}
              </g>
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
    case "gated-frequency": {
      const time = playhead * number(latent.videoDurationMs);
      const eventCells = latent.eventCells as number[];
      const eventGates = latent.eventGates as string[];
      const localTime = time - 500;
      const eventIndex = Math.floor(localTime / 500);
      const active = eventIndex >= 0 && eventIndex < eventCells.length && localTime % 500 < 380;
      const activeCell = active ? eventCells[eventIndex] : undefined;
      const activeGate = active ? eventGates[eventIndex]! : String(latent.targetGate);
      const gateColor = activeGate === "AMBER" ? "#d79d00" : "#1399ad";
      return (
        <div className="video-stage" role="img" aria-label="A color-gated stream of labeled grid flashes">
          <svg className="diagnostic-svg" viewBox="0 0 140 100">
            <rect width="140" height="100" fill="#e8e5da" />
            <text x="70" y="9" textAnchor="middle" fontSize="5" fontWeight="700" fill="#171915">
              EXACTLY TWICE · ONLY {String(latent.targetGate)}
            </text>
            <rect
              x="27"
              y="13"
              width="86"
              height="78"
              rx="4"
              fill="#fffdf7"
              stroke={gateColor}
              strokeWidth="3"
            />
            {Array.from({ length: 36 }, (_, cell) => {
              const row = Math.floor(cell / 6);
              const column = cell % 6;
              const x = 31 + column * 13;
              const y = 17 + row * 11.5;
              const lit = activeCell === cell;
              return (
                <g key={cell}>
                  <rect
                    x={x}
                    y={y}
                    width="11"
                    height="9"
                    rx="1"
                    fill={lit ? gateColor : "#f5f2e9"}
                    stroke="#4b4e48"
                    strokeWidth=".45"
                  />
                  <text
                    x={x + 5.5}
                    y={y + 6.2}
                    textAnchor="middle"
                    fontSize="3.2"
                    fontWeight="700"
                    fill={lit ? "#fff" : "#4b4e48"}
                  >
                    {String.fromCharCode(65 + column)}
                    {row + 1}
                  </text>
                </g>
              );
            })}
            <text x="70" y="97" textAnchor="middle" fontSize="4" fontWeight="700" fill="#171915">
              {eventIndex < 0
                ? "GET READY"
                : eventIndex < eventCells.length
                  ? `FLASH ${eventIndex + 1} / ${eventCells.length} · ${activeGate}`
                  : "SEQUENCE COMPLETE"}
            </text>
          </svg>
          <div className="video-progress">
            <span style={{ "--progress": `${playhead * 100}%` } as CSSProperties} />
          </div>
        </div>
      );
    }
    case "gated-pair-collision": {
      const time = playhead * number(latent.videoDurationMs);
      const left = latent.eventLeft as string[];
      const right = latent.eventRight as string[];
      const gates = latent.eventGates as string[];
      const localTime = time - 500;
      const eventIndex = Math.floor(localTime / 500);
      const phase = ((localTime % 500) + 500) % 500;
      const active = eventIndex >= 0 && eventIndex < left.length && phase < 380;
      const gate = active ? gates[eventIndex]! : String(latent.targetGate);
      const gateColor = gate === "AMBER" ? "#d79d00" : "#1399ad";
      const approach = active ? Math.sin((phase / 380) * Math.PI) : 0;
      return (
        <div
          className="video-stage"
          role="img"
          aria-label="Labeled pairs collide under alternating frame colors"
        >
          <svg className="diagnostic-svg" viewBox="0 0 140 100">
            <rect width="140" height="100" fill="#e8e5da" />
            <text x="70" y="11" textAnchor="middle" fontSize="5" fontWeight="700" fill="#171915">
              COUNT {(latent.targetPair as string[]).join("+")} · ONLY {String(latent.targetGate)}
            </text>
            <rect
              x="10"
              y="17"
              width="120"
              height="67"
              rx="5"
              fill="#fffdf7"
              stroke={gateColor}
              strokeWidth="4"
            />
            {active ? (
              <>
                <circle cx={42 + approach * 20} cy="50" r="12" fill="#2356c7" />
                <circle cx={98 - approach * 20} cy="50" r="12" fill="#f04b32" />
                <text
                  x={42 + approach * 20}
                  y="54"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#fff"
                >
                  {left[eventIndex]}
                </text>
                <text
                  x={98 - approach * 20}
                  y="54"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#fff"
                >
                  {right[eventIndex]}
                </text>
              </>
            ) : null}
            <text x="70" y="94" textAnchor="middle" fontSize="4" fontWeight="700" fill="#171915">
              {eventIndex < 0
                ? "GET READY"
                : eventIndex < left.length
                  ? `COLLISION ${eventIndex + 1} / ${left.length} · ${gate}`
                  : "SEQUENCE COMPLETE"}
            </text>
          </svg>
          <div className="video-progress">
            <span style={{ "--progress": `${playhead * 100}%` } as CSSProperties} />
          </div>
        </div>
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
