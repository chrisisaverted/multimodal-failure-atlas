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
    case "parity-verification": {
      const gridSize = number(latent.gridSize);
      const bits = latent.panelBits as number[];
      const labels = ["A", "B", "C", "D"];
      const cellSize = 35 / gridSize;
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="Four binary matrices for exact row and column parity verification"
        >
          <rect width="140" height="100" fill={palette.cream} />
          {labels.map((label, panel) => {
            const x = panel % 2 === 0 ? 19 : 86;
            const y = panel < 2 ? 5 : 54;
            const panelBits = bits.slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize);
            return (
              <g key={label}>
                <text x={x - 8} y={y + 20} fontSize="7" fontWeight="700">
                  {label}
                </text>
                <rect
                  x={x - 1}
                  y={y - 1}
                  width="37"
                  height="37"
                  fill="#fffdf7"
                  stroke="#4b4e48"
                  strokeWidth=".6"
                />
                {panelBits.map((value, index) =>
                  value ? (
                    <circle
                      key={index}
                      cx={x + ((index % gridSize) + 0.5) * cellSize}
                      cy={y + (Math.floor(index / gridSize) + 0.5) * cellSize}
                      r={cellSize * 0.31}
                      fill="#252821"
                    />
                  ) : null,
                )}
              </g>
            );
          })}
        </svg>
      );
    }
    case "change-localization": {
      const gridSize = number(latent.gridSize);
      const grids = [latent.glyphA as number[], latent.glyphB as number[]];
      const side = 52;
      const cell = side / gridSize;
      const glyph = (value: number, x: number, y: number, key: number) => {
        const radius = Math.max(0.45, cell * 0.27);
        if (value === 0) return <circle key={key} cx={x} cy={y} r={radius} fill="#2356c7" />;
        if (value === 1)
          return (
            <rect
              key={key}
              x={x - radius}
              y={y - radius}
              width={radius * 2}
              height={radius * 2}
              fill="#f04b32"
            />
          );
        if (value === 2)
          return (
            <path
              key={key}
              d={`M${x - radius} ${y}H${x + radius}`}
              stroke="#168e88"
              strokeWidth={Math.max(0.45, radius * 0.7)}
            />
          );
        return (
          <path
            key={key}
            d={`M${x} ${y - radius}V${y + radius}`}
            stroke="#8062d6"
            strokeWidth={Math.max(0.45, radius * 0.7)}
          />
        );
      };
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="Two registered glyph grids containing exactly one change"
        >
          <rect width="140" height="100" fill={palette.cream} />
          {grids.map((values, grid) => {
            const originX = grid === 0 ? 8 : 80;
            const originY = 24;
            return (
              <g key={grid}>
                <text x={originX + side / 2} y="13" textAnchor="middle" fontSize="6" fontWeight="700">
                  {grid === 0 ? "LEFT" : "RIGHT"}
                </text>
                <rect
                  x={originX}
                  y={originY}
                  width={side}
                  height={side}
                  fill="#fffdf7"
                  stroke="#252821"
                  strokeWidth=".6"
                />
                {values.map((value, index) =>
                  glyph(
                    value,
                    originX + ((index % gridSize) + 0.5) * cell,
                    originY + (Math.floor(index / gridSize) + 0.5) * cell,
                    index,
                  ),
                )}
                <line
                  x1={originX + side / 2}
                  x2={originX + side / 2}
                  y1={originY}
                  y2={originY + side}
                  stroke="#252821"
                  opacity=".3"
                />
                <line
                  x1={originX}
                  x2={originX + side}
                  y1={originY + side / 2}
                  y2={originY + side / 2}
                  stroke="#252821"
                  opacity=".3"
                />
                {["A", "B", "C", "D"].map((label, region) =>
                  grid === 1 ? (
                    <text
                      key={label}
                      x={originX + 4 + (region % 2) * (side - 8)}
                      y={originY + 7 + Math.floor(region / 2) * (side - 9)}
                      fontSize="5"
                      fontWeight="800"
                      fill="#171915"
                    >
                      {label}
                    </text>
                  ) : null,
                )}
              </g>
            );
          })}
        </svg>
      );
    }
    case "maze-reachability": {
      const gridSize = number(latent.gridSize);
      const openRight = latent.openRight as number[];
      const openDown = latent.openDown as number[];
      const endpoints = latent.endpointCells as number[];
      const start = number(latent.startCell);
      const originX = 29;
      const originY = 6;
      const side = 82;
      const cell = side / gridSize;
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="A partitioned maze with one endpoint reachable from S"
        >
          <rect width="140" height="100" fill={palette.cream} />
          <rect
            x={originX}
            y={originY}
            width={side}
            height={side}
            fill="#fffdf7"
            stroke="#252821"
            strokeWidth="1.2"
          />
          {Array.from({ length: gridSize * gridSize }, (_, index) => {
            const row = Math.floor(index / gridSize);
            const column = index % gridSize;
            return (
              <g key={index}>
                {column + 1 < gridSize && !openRight[index] ? (
                  <line
                    x1={originX + (column + 1) * cell}
                    x2={originX + (column + 1) * cell}
                    y1={originY + row * cell}
                    y2={originY + (row + 1) * cell}
                    stroke="#252821"
                    strokeWidth=".75"
                  />
                ) : null}
                {row + 1 < gridSize && !openDown[index] ? (
                  <line
                    x1={originX + column * cell}
                    x2={originX + (column + 1) * cell}
                    y1={originY + (row + 1) * cell}
                    y2={originY + (row + 1) * cell}
                    stroke="#252821"
                    strokeWidth=".75"
                  />
                ) : null}
              </g>
            );
          })}
          <circle
            cx={originX + ((start % gridSize) + 0.5) * cell}
            cy={originY + (Math.floor(start / gridSize) + 0.5) * cell}
            r={cell * 0.34}
            fill="#d9f43c"
          />
          <text
            x={originX + ((start % gridSize) + 0.5) * cell}
            y={originY + (Math.floor(start / gridSize) + 0.68) * cell}
            textAnchor="middle"
            fontSize={Math.max(3.2, cell * 0.45)}
            fontWeight="800"
          >
            S
          </text>
          {endpoints.map((endpoint, index) => (
            <text
              key={endpoint}
              x={originX + ((endpoint % gridSize) + 0.5) * cell}
              y={originY + (Math.floor(endpoint / gridSize) + 0.68) * cell}
              textAnchor="middle"
              fontSize={Math.max(3.2, cell * 0.45)}
              fontWeight="800"
              fill="#f04b32"
            >
              {["A", "B", "C", "D"][index]}
            </text>
          ))}
        </svg>
      );
    }
    case "rotation-correspondence": {
      const side = number(latent.side);
      const pointCount = number(latent.pointCount);
      const source = latent.sourcePoints as number[];
      const candidates = latent.candidatePoints as number[];
      const renderPoints = (points: number[], x: number, y: number, box: number, key: string) => (
        <g key={key}>
          <rect x={x} y={y} width={box} height={box} fill="#fffdf7" stroke="#4b4e48" strokeWidth=".6" />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={x + (((point % side) + 0.5) * box) / side}
              cy={y + ((Math.floor(point / side) + 0.5) * box) / side}
              r={Math.max(1, (box / side) * 0.23)}
              fill={index % 3 === 0 ? "#f04b32" : "#2356c7"}
            />
          ))}
        </g>
      );
      return (
        <svg
          className="diagnostic-svg"
          viewBox="0 0 140 100"
          role="img"
          aria-label="A source point constellation and four rotated candidate constellations"
        >
          <rect width="140" height="100" fill={palette.cream} />
          <text x="28" y="8" textAnchor="middle" fontSize="5" fontWeight="700">
            SOURCE
          </text>
          {renderPoints(source, 8, 12, 40, "source")}
          <path d="M57 31h13l-4-4m4 4-4 4" fill="none" stroke="#f04b32" strokeWidth="1.3" />
          {["A", "B", "C", "D"].map((label, panel) => {
            const x = 76 + (panel % 2) * 31;
            const y = 8 + Math.floor(panel / 2) * 45;
            return (
              <g key={label}>
                <text x={x - 5} y={y + 16} fontSize="6" fontWeight="800">
                  {label}
                </text>
                {renderPoints(
                  candidates.slice(panel * pointCount, (panel + 1) * pointCount),
                  x,
                  y,
                  26,
                  `candidate-${label}`,
                )}
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
    case "route-turn-integration": {
      const duration = number(latent.videoDurationMs);
      const time = playhead * duration;
      const path = latent.path as number[];
      const stepCount = number(latent.stepCount);
      const localTime = time - 800;
      const step = Math.floor(localTime / 400);
      const boundedStep = Math.max(0, Math.min(stepCount - 1, step));
      const progress = Math.max(0, Math.min(1, (localTime - step * 400) / 320));
      const fromX = path[boundedStep * 2]!;
      const fromY = path[boundedStep * 2 + 1]!;
      const toX = path[(boundedStep + 1) * 2]!;
      const toY = path[(boundedStep + 1) * 2 + 1]!;
      return (
        <div
          className="video-stage"
          role="img"
          aria-label="A gold disk follows an invisible orthogonal route"
        >
          <svg className="diagnostic-svg" viewBox="0 0 140 100">
            <rect width="140" height="100" fill="#e8e5da" />
            <text x="70" y="8" textAnchor="middle" fontSize="5" fontWeight="700">
              COUNT DIRECTION CHANGES
            </text>
            <rect x="18" y="13" width="104" height="76" fill="#fffdf7" stroke="#252821" strokeWidth="1.2" />
            {Array.from({ length: 16 }, (_, index) => (
              <g key={index} opacity=".16">
                <line x1={22 + index * 6.4} x2={22 + index * 6.4} y1="15" y2="87" stroke="#171915" />
                <line x1="20" x2="120" y1={17 + index * 4.55} y2={17 + index * 4.55} stroke="#171915" />
              </g>
            ))}
            <circle
              cx={22 + (fromX + (toX - fromX) * progress) * 6.4}
              cy={17 + (fromY + (toY - fromY) * progress) * 4.55}
              r="3.8"
              fill="#f4d934"
              stroke="#252821"
              strokeWidth="1"
            />
            <text x="70" y="96" textAnchor="middle" fontSize="4" fontWeight="700">
              {step < 0
                ? "GET READY"
                : step < stepCount
                  ? `MOVE ${step + 1} / ${stepCount}`
                  : "ROUTE COMPLETE"}
            </text>
          </svg>
          <div className="video-progress">
            <span style={{ "--progress": `${playhead * 100}%` } as CSSProperties} />
          </div>
        </div>
      );
    }
    case "target-transition-count": {
      const time = playhead * number(latent.videoDurationMs);
      const sequence = latent.sequence as number[];
      const localTime = time - 800;
      const eventIndex = Math.floor(localTime / 360);
      const active = eventIndex >= 0 && eventIndex < sequence.length && localTime % 360 < 280;
      const symbol = active ? sequence[eventIndex] : -1;
      const renderSymbol = (value: number, x: number, y: number, size: number) => {
        if (value === 0) return <circle cx={x} cy={y} r={size * 0.42} fill="#2466cc" />;
        if (value === 1)
          return (
            <polygon
              points={`${x},${y - size * 0.48} ${x - size * 0.46},${y + size * 0.42} ${x + size * 0.46},${y + size * 0.42}`}
              fill="#f4d934"
            />
          );
        if (value === 2)
          return (
            <rect
              x={x - size * 0.4}
              y={y - size * 0.4}
              width={size * 0.8}
              height={size * 0.8}
              rx="2"
              fill="#df3c30"
            />
          );
        if (value === 3)
          return (
            <path
              d={`M${x - size * 0.45} ${y}H${x + size * 0.45}M${x} ${y - size * 0.45}V${y + size * 0.45}`}
              stroke="#9146c7"
              strokeWidth={size * 0.24}
            />
          );
        return null;
      };
      return (
        <div className="video-stage" role="img" aria-label="A rapid sequence of four symbols">
          <svg className="diagnostic-svg" viewBox="0 0 140 100">
            <rect width="140" height="100" fill="#e8e5da" />
            <text x="70" y="8" textAnchor="middle" fontSize="5" fontWeight="700">
              COUNT THIS TRANSITION
            </text>
            {renderSymbol(0, 53, 21, 13)}
            <text x="70" y="24" textAnchor="middle" fontSize="9" fontWeight="700">
              →
            </text>
            {renderSymbol(2, 87, 21, 13)}
            {renderSymbol(symbol, 70, 57, 36)}
            <text x="70" y="91" textAnchor="middle" fontSize="4.5" fontWeight="700">
              {eventIndex < 0
                ? "GET READY"
                : eventIndex < sequence.length
                  ? `SYMBOL ${eventIndex + 1} / ${sequence.length}`
                  : "SEQUENCE COMPLETE"}
            </text>
          </svg>
          <div className="video-progress">
            <span style={{ "--progress": `${playhead * 100}%` } as CSSProperties} />
          </div>
        </div>
      );
    }
    case "sequential-swap-tracking": {
      const time = playhead * number(latent.videoDurationMs);
      const left = latent.swapLeft as number[];
      const right = latent.swapRight as number[];
      const localTime = time - 900;
      const activeIndex = Math.floor(localTime / 950);
      const phase = Math.max(0, Math.min(1, (localTime - activeIndex * 950) / 800));
      const eased = phase * phase * (3 - 2 * phase);
      const positions = [0, 1, 2, 3];
      for (let index = 0; index < Math.min(left.length, Math.max(0, activeIndex)); index += 1) {
        const a = left[index]!;
        const b = right[index]!;
        [positions[a], positions[b]] = [positions[b]!, positions[a]!];
      }
      const activeLeft = activeIndex >= 0 && activeIndex < left.length ? left[activeIndex]! : -1;
      const activeRight = activeIndex >= 0 && activeIndex < right.length ? right[activeIndex]! : -1;
      const slotX = [26, 55, 85, 114];
      return (
        <div className="video-stage" role="img" aria-label="Four tokens repeatedly swap slots">
          <svg className="diagnostic-svg" viewBox="0 0 140 100">
            <rect width="140" height="100" fill="#e8e5da" />
            <text x="70" y="9" textAnchor="middle" fontSize="5" fontWeight="700">
              TRACK THE ORIGINAL GOLD TOKEN
            </text>
            <text x="70" y="18" textAnchor="middle" fontSize="4.2">
              {time < 900
                ? "MEMORIZE"
                : activeIndex < left.length
                  ? `SWAP ${Math.max(1, activeIndex + 1)} / ${left.length}`
                  : "FINAL POSITIONS"}
            </text>
            <line x1="13" x2="127" y1="71" y2="71" stroke="#252821" strokeWidth="1.2" />
            {positions.map((identity, slot) => {
              const other = slot === activeLeft ? activeRight : slot === activeRight ? activeLeft : -1;
              const x = other < 0 ? slotX[slot]! : slotX[slot]! + (slotX[other]! - slotX[slot]!) * eased;
              const y = other < 0 ? 57 : 57 - Math.sin(Math.PI * eased) * (slot === activeLeft ? 13 : -9);
              return (
                <circle
                  key={identity}
                  cx={x}
                  cy={y}
                  r="7"
                  fill={identity === number(latent.initialTarget) && time < 900 ? "#e0a600" : "#59605d"}
                  stroke="#252821"
                  strokeWidth="1"
                />
              );
            })}
            {slotX.map((x, index) => (
              <text key={x} x={x} y="84" textAnchor="middle" fontSize="7" fontWeight="700">
                {index + 1}
              </text>
            ))}
          </svg>
          <div className="video-progress">
            <span style={{ "--progress": `${playhead * 100}%` } as CSSProperties} />
          </div>
        </div>
      );
    }
    case "signed-state-accumulation": {
      const time = playhead * number(latent.videoDurationMs);
      const events = latent.events as number[];
      const localTime = time - 800;
      const eventIndex = Math.floor(localTime / 260);
      const active = eventIndex >= 0 && eventIndex < events.length && localTime % 260 < 210;
      const value = active ? events[eventIndex] : 0;
      return (
        <div
          className="video-stage"
          role="img"
          aria-label="A stream of signed unit events updates a hidden counter"
        >
          <svg className="diagnostic-svg" viewBox="0 0 140 100">
            <rect width="140" height="100" fill="#e8e5da" />
            <text x="70" y="10" textAnchor="middle" fontSize="5" fontWeight="700">
              START AT ZERO · UPDATE EVERY EVENT
            </text>
            <text
              x="70"
              y="63"
              textAnchor="middle"
              fontSize="32"
              fontWeight="800"
              fill={value > 0 ? "#1d9b5f" : "#df3c30"}
            >
              {value > 0 ? "+1" : value < 0 ? "−1" : ""}
            </text>
            <text x="70" y="90" textAnchor="middle" fontSize="4.5" fontWeight="700">
              {eventIndex < 0
                ? "START AT 0"
                : eventIndex < events.length
                  ? `EVENT ${eventIndex + 1} / ${events.length}`
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
