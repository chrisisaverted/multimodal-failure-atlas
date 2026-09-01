import type { DiagnosticInstance } from "../types";

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

function shape(kind: string, fill: string, x: number, y: number, size: number) {
  if (kind === "circle") return `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${fill}"/>`;
  if (kind === "triangle") {
    return `<path d="M ${x} ${y - size / 2} L ${x + size / 2} ${y + size / 2} L ${x - size / 2} ${y + size / 2} Z" fill="${fill}"/>`;
  }
  if (kind === "diamond") {
    return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${fill}" transform="rotate(45 ${x} ${y})"/>`;
  }
  return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" rx="2" fill="${fill}"/>`;
}

function videoStage(body: string) {
  return `<rect width="140" height="100" fill="#e8e5da"/><path d="M0 82H140" stroke="#171915" opacity=".12"/>${body}`;
}

/**
 * Pure reference renderer used to materialize the exact pixels sent to models.
 * It mirrors DiagnosticVisual's geometry but is independent of React and browser timing.
 */
export function renderDiagnosticSvg(instance: DiagnosticInstance, playhead = 0) {
  const latent = instance.latent;
  let body = "";

  switch (instance.generator) {
    case "small-object": {
      const distractors = Array.from({ length: number(latent.distractors) }, (_, index) => ({
        x: 8 + ((index * 29 + instance.seed * 7) % 84),
        y: 10 + ((index * 47 + instance.seed * 11) % 80),
        size: 2 + (index % 4),
      }));
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${distractors
        .map(
          (dot) => `<circle cx="${dot.x}" cy="${dot.y}" r="${dot.size / 2}" fill="#aaa99f" opacity=".48"/>`,
        )
        .join("")}${shape(
        String(latent.target),
        palette[String(latent.targetColor)]!,
        20 + number(latent.x),
        number(latent.y),
        Math.max(2.4, number(latent.size) / 2),
      )}`;
      break;
    }
    case "patch-phase": {
      const offset = number(latent.offset);
      const separation = number(latent.separation);
      const strokeWidth = number(latent.strokeWidth);
      const grid = [
        ...Array.from(
          { length: 11 },
          (_, index) =>
            `<line x1="${index * 14}" x2="${index * 14}" y1="0" y2="100" stroke="#171915" opacity=".08"/>`,
        ),
        ...Array.from(
          { length: 8 },
          (_, index) =>
            `<line y1="${index * 14}" y2="${index * 14}" x1="0" x2="140" stroke="#171915" opacity=".08"/>`,
        ),
      ].join("");
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${grid}<circle cx="${42 + offset}" cy="50" r="20" fill="none" stroke="${palette.cobalt}" stroke-width="${strokeWidth}"/><circle cx="${42 + offset + separation}" cy="50" r="20" fill="none" stroke="${palette.vermillion}" stroke-width="${strokeWidth}"/>`;
      break;
    }
    case "attribute-binding": {
      const items = latent.shapes as string[];
      const itemColors = latent.colors as string[];
      const itemSize = number(latent.itemSize);
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${items
        .map((item, index) =>
          shape(item, palette[itemColors[index]!]!, 25 + index * 30, 50 + (index % 2 ? 7 : -5), itemSize),
        )
        .join("")}`;
      break;
    }
    case "numerosity-density": {
      const count = number(latent.count);
      const radius = number(latent.radius) * 0.7;
      const spread = number(latent.spread);
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${Array.from(
        { length: count },
        (_, index) => {
          const angle = (index / count) * Math.PI * 2 + instance.seed * 0.1;
          const ring = spread * (0.65 + (index % 3) * 0.18);
          return `<circle cx="${70 + Math.cos(angle) * ring}" cy="${50 + Math.sin(angle) * ring}" r="${radius}" fill="${palette.violet}" stroke="${palette.cream}" stroke-width="1"/>`;
        },
      ).join("")}`;
      break;
    }
    case "dense-symmetry": {
      const gridSize = number(latent.gridSize);
      const bits = latent.panelBits as number[];
      const cellSize = 36 / gridSize;
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${["A", "B", "C", "D"]
        .map((label, panel) => {
          const originX = panel % 2 === 0 ? 18 : 86;
          const originY = panel < 2 ? 5 : 54;
          const panelBits = bits.slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize);
          const cells = panelBits
            .map((value, index) =>
              value
                ? `<rect x="${originX + (index % gridSize) * cellSize}" y="${originY + Math.floor(index / gridSize) * cellSize}" width="${cellSize + 0.05}" height="${cellSize + 0.05}" fill="${panel % 2 === 0 ? palette.cobalt : palette.violet}"/>`
                : "",
            )
            .join("");
          return `<text x="${originX - 7}" y="${originY + 21}" font-size="7" font-weight="700">${label}</text><rect x="${originX - 1}" y="${originY - 1}" width="38" height="38" fill="#fffdf7" stroke="#4b4e48" stroke-width=".6"/>${cells}<line x1="${originX + 18}" x2="${originX + 18}" y1="${originY - 1}" y2="${originY + 37}" stroke="#f04b32" stroke-width=".45" opacity=".75"/>`;
        })
        .join("")}`;
      break;
    }
    case "dense-xor": {
      const gridSize = number(latent.gridSize);
      const inputA = latent.inputA as number[];
      const inputB = latent.inputB as number[];
      const candidates = latent.candidateBits as number[];
      const grid = (bits: number[], originX: number, originY: number, side: number) => {
        const cellSize = side / gridSize;
        return `<rect x="${originX - 0.7}" y="${originY - 0.7}" width="${side + 1.4}" height="${side + 1.4}" fill="#fffdf7" stroke="#4b4e48" stroke-width=".55"/>${bits
          .map((value, index) =>
            value
              ? `<rect x="${originX + (index % gridSize) * cellSize}" y="${originY + Math.floor(index / gridSize) * cellSize}" width="${cellSize + 0.04}" height="${cellSize + 0.04}" fill="${palette.cobalt}"/>`
              : "",
          )
          .join("")}`;
      };
      body = `<rect width="140" height="100" fill="${palette.cream}"/><text x="40" y="6" text-anchor="middle" font-size="4.5" font-weight="700">INPUT 1</text><text x="100" y="6" text-anchor="middle" font-size="4.5" font-weight="700">INPUT 2</text>${grid(inputA, 28, 10, 24)}${grid(inputB, 88, 10, 24)}<text x="70" y="26" text-anchor="middle" font-size="10" font-weight="700" fill="${palette.vermillion}">XOR</text>${[
        "A",
        "B",
        "C",
        "D",
      ]
        .map((label, panel) => {
          const originX = 6 + panel * 34;
          const panelBits = candidates.slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize);
          return `<text x="${originX + 12}" y="56" text-anchor="middle" font-size="5" font-weight="700">${label}</text>${grid(panelBits, originX, 61, 24)}`;
        })
        .join("")}`;
      break;
    }
    case "parity-verification": {
      const gridSize = number(latent.gridSize);
      const bits = latent.panelBits as number[];
      const cellSize = 35 / gridSize;
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${["A", "B", "C", "D"]
        .map((label, panel) => {
          const x = panel % 2 === 0 ? 19 : 86,
            y = panel < 2 ? 5 : 54;
          const cells = bits
            .slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize)
            .map((value, index) =>
              value
                ? `<circle cx="${x + ((index % gridSize) + 0.5) * cellSize}" cy="${y + (Math.floor(index / gridSize) + 0.5) * cellSize}" r="${cellSize * 0.31}" fill="#252821"/>`
                : "",
            )
            .join("");
          return `<text x="${x - 8}" y="${y + 20}" font-size="7" font-weight="700">${label}</text><rect x="${x - 1}" y="${y - 1}" width="37" height="37" fill="#fffdf7" stroke="#4b4e48" stroke-width=".6"/>${cells}`;
        })
        .join("")}`;
      break;
    }
    case "change-localization": {
      const gridSize = number(latent.gridSize),
        side = 52,
        cell = side / gridSize;
      const glyph = (value: number, x: number, y: number) =>
        value === 0
          ? `<circle cx="${x}" cy="${y}" r="${Math.max(0.45, cell * 0.27)}" fill="#2356c7"/>`
          : value === 1
            ? `<rect x="${x - Math.max(0.45, cell * 0.27)}" y="${y - Math.max(0.45, cell * 0.27)}" width="${Math.max(0.9, cell * 0.54)}" height="${Math.max(0.9, cell * 0.54)}" fill="#f04b32"/>`
            : value === 2
              ? `<path d="M${x - cell * 0.27} ${y}H${x + cell * 0.27}" stroke="#168e88" stroke-width=".55"/>`
              : `<path d="M${x} ${y - cell * 0.27}V${y + cell * 0.27}" stroke="#8062d6" stroke-width=".55"/>`;
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${[
        latent.glyphA as number[],
        latent.glyphB as number[],
      ]
        .map((values, grid) => {
          const x = grid === 0 ? 8 : 80,
            y = 24;
          const marks = values
            .map((value, index) =>
              glyph(
                value,
                x + ((index % gridSize) + 0.5) * cell,
                y + (Math.floor(index / gridSize) + 0.5) * cell,
              ),
            )
            .join("");
          const labels = grid
            ? ["A", "B", "C", "D"]
                .map(
                  (label, region) =>
                    `<text x="${x + 4 + (region % 2) * (side - 8)}" y="${y + 7 + Math.floor(region / 2) * (side - 9)}" font-size="5" font-weight="800">${label}</text>`,
                )
                .join("")
            : "";
          return `<text x="${x + side / 2}" y="13" text-anchor="middle" font-size="6" font-weight="700">${grid ? "RIGHT" : "LEFT"}</text><rect x="${x}" y="${y}" width="${side}" height="${side}" fill="#fffdf7" stroke="#252821" stroke-width=".6"/>${marks}<line x1="${x + side / 2}" x2="${x + side / 2}" y1="${y}" y2="${y + side}" stroke="#252821" opacity=".3"/><line x1="${x}" x2="${x + side}" y1="${y + side / 2}" y2="${y + side / 2}" stroke="#252821" opacity=".3"/>${labels}`;
        })
        .join("")}`;
      break;
    }
    case "maze-reachability": {
      const gridSize = number(latent.gridSize),
        openRight = latent.openRight as number[],
        openDown = latent.openDown as number[],
        endpoints = latent.endpointCells as number[],
        start = number(latent.startCell),
        originX = 29,
        originY = 6,
        side = 82,
        cell = side / gridSize;
      const walls = Array.from({ length: gridSize * gridSize }, (_, index) => {
        const row = Math.floor(index / gridSize),
          column = index % gridSize;
        return `${column + 1 < gridSize && !openRight[index] ? `<line x1="${originX + (column + 1) * cell}" x2="${originX + (column + 1) * cell}" y1="${originY + row * cell}" y2="${originY + (row + 1) * cell}" stroke="#252821" stroke-width=".75"/>` : ""}${row + 1 < gridSize && !openDown[index] ? `<line x1="${originX + column * cell}" x2="${originX + (column + 1) * cell}" y1="${originY + (row + 1) * cell}" y2="${originY + (row + 1) * cell}" stroke="#252821" stroke-width=".75"/>` : ""}`;
      }).join("");
      const marker = (cellIndex: number, label: string, fill: string) =>
        `<text x="${originX + ((cellIndex % gridSize) + 0.5) * cell}" y="${originY + (Math.floor(cellIndex / gridSize) + 0.68) * cell}" text-anchor="middle" font-size="${Math.max(3.2, cell * 0.45)}" font-weight="800" fill="${fill}">${label}</text>`;
      body = `<rect width="140" height="100" fill="${palette.cream}"/><rect x="${originX}" y="${originY}" width="${side}" height="${side}" fill="#fffdf7" stroke="#252821" stroke-width="1.2"/>${walls}${marker(start, "S", "#171915")}${endpoints.map((endpoint, index) => marker(endpoint, ["A", "B", "C", "D"][index]!, "#f04b32")).join("")}`;
      break;
    }
    case "rotation-correspondence": {
      const side = number(latent.side),
        pointCount = number(latent.pointCount),
        source = latent.sourcePoints as number[],
        candidates = latent.candidatePoints as number[];
      const constellation = (points: number[], x: number, y: number, box: number) =>
        `<rect x="${x}" y="${y}" width="${box}" height="${box}" fill="#fffdf7" stroke="#4b4e48" stroke-width=".6"/>${points.map((point, index) => `<circle cx="${x + (((point % side) + 0.5) * box) / side}" cy="${y + ((Math.floor(point / side) + 0.5) * box) / side}" r="${Math.max(1, (box / side) * 0.23)}" fill="${index % 3 === 0 ? "#f04b32" : "#2356c7"}"/>`).join("")}`;
      body = `<rect width="140" height="100" fill="${palette.cream}"/><text x="28" y="8" text-anchor="middle" font-size="5" font-weight="700">SOURCE</text>${constellation(source, 8, 12, 40)}<path d="M57 31h13l-4-4m4 4-4 4" fill="none" stroke="#f04b32" stroke-width="1.3"/>${[
        "A",
        "B",
        "C",
        "D",
      ]
        .map((label, panel) => {
          const x = 76 + (panel % 2) * 31,
            y = 8 + Math.floor(panel / 2) * 45;
          return `<text x="${x - 5}" y="${y + 16}" font-size="6" font-weight="800">${label}</text>${constellation(candidates.slice(panel * pointCount, (panel + 1) * pointCount), x, y, 26)}`;
        })
        .join("")}`;
      break;
    }
    case "wire-crossing-count": {
      const targetPath = latent.targetPath as number[],
        distractors = latent.distractors as number[],
        crossingX = latent.crossingX as number[],
        crossingY = latent.crossingY as number[];
      const clutter = Array.from(
        { length: distractors.length / 4 },
        (_, index) =>
          `<line x1="${distractors[index * 4]}" y1="${distractors[index * 4 + 1]}" x2="${distractors[index * 4 + 2]}" y2="${distractors[index * 4 + 3]}" stroke="#9a9b93" stroke-width=".7" opacity=".55"/>`,
      ).join("");
      const points = Array.from(
        { length: targetPath.length / 2 },
        (_, index) => `${targetPath[index * 2]},${targetPath[index * 2 + 1]}`,
      ).join(" ");
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${clutter}<polyline points="${points}" fill="none" stroke="#2356c7" stroke-width="1.8" stroke-linejoin="round"/>${crossingX.map((x, index) => `<line x1="${x}" x2="${x}" y1="${crossingY[index]! - 3.2}" y2="${crossingY[index]! + 3.2}" stroke="#f04b32" stroke-width="1.1"/>`).join("")}<circle cx="4" cy="${crossingY[0]}" r="3" fill="#2356c7"/><text x="4" y="${crossingY[0]! + 1.8}" text-anchor="middle" font-size="4" font-weight="800" fill="#fff">T</text>`;
      break;
    }
    case "enclosure-depth": {
      const depths = latent.panelDepths as number[],
        clutterCount = number(latent.clutterCount);
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${depths
        .map((depth, panel) => {
          const x = panel % 2 === 0 ? 38 : 103,
            y = panel < 2 ? 26 : 73;
          return `<text x="${x - 24}" y="${y + 2}" font-size="7" font-weight="800">${["A", "B", "C", "D"][panel]}</text>${Array.from({ length: depth }, (_, ring) => `<ellipse cx="${x}" cy="${y}" rx="${3.2 + ring * 1.35}" ry="${2.8 + ring * 1.05}" fill="none" stroke="#252821" stroke-width=".48" transform="rotate(${((ring % 3) - 1) * 4} ${x} ${y})"/>`).join("")}${Array.from({ length: clutterCount }, (_, ring) => `<circle cx="${x + 18 + (ring % 2) * 3}" cy="${y - 13 + ring * 2.4}" r="${1.8 + (ring % 3)}" fill="none" stroke="#9a9b93" stroke-width=".4"/>`).join("")}<circle cx="${x}" cy="${y}" r="1.7" fill="#f04b32"/>`;
        })
        .join("")}`;
      break;
    }
    case "cube-stack-count": {
      const heights = latent.panelHeights as number[];
      const cube = (x: number, y: number) =>
        `<polygon points="${x},${y - 2} ${x + 3},${y - 0.5} ${x},${y + 1} ${x - 3},${y - 0.5}" fill="#f6dc55" stroke="#252821" stroke-width=".35"/><polygon points="${x - 3},${y - 0.5} ${x},${y + 1} ${x},${y + 4} ${x - 3},${y + 2.5}" fill="#d0a91f" stroke="#252821" stroke-width=".35"/><polygon points="${x + 3},${y - 0.5} ${x},${y + 1} ${x},${y + 4} ${x + 3},${y + 2.5}" fill="#e8c43c" stroke="#252821" stroke-width=".35"/>`;
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${["A", "B", "C", "D"]
        .map((label, panel) => {
          const originX = panel % 2 === 0 ? 35 : 100,
            originY = panel < 2 ? 42 : 88,
            panelHeights = heights.slice(panel * 9, (panel + 1) * 9);
          const cubes = [...panelHeights.keys()]
            .sort((a, b) => Math.floor(a / 3) + (a % 3) - Math.floor(b / 3) - (b % 3))
            .flatMap((index) => {
              const row = Math.floor(index / 3),
                column = index % 3;
              return Array.from({ length: panelHeights[index]! }, (_, level) =>
                cube(originX + (column - row) * 6, originY - 8 + (column + row) * 3 - level * 3),
              );
            })
            .join("");
          return `<text x="${originX - 27}" y="${originY - 18}" font-size="7" font-weight="800">${label}</text>${cubes}`;
        })
        .join("")}`;
      break;
    }
    case "graph-degree-topology": {
      const nodeCount = number(latent.nodeCount),
        edgeFrom = latent.edgeFrom as number[],
        edgeTo = latent.edgeTo as number[],
        offsets = latent.edgeOffsets as number[];
      body = `<rect width="140" height="100" fill="${palette.cream}"/>${["A", "B", "C", "D"]
        .map((label, panel) => {
          const centerX = panel % 2 === 0 ? 38 : 103,
            centerY = panel < 2 ? 25 : 74,
            positions = Array.from({ length: nodeCount }, (_, node) => [
              centerX + Math.cos((node / nodeCount) * Math.PI * 2 + panel * 0.2) * 20,
              centerY + Math.sin((node / nodeCount) * Math.PI * 2 + panel * 0.2) * 16,
            ]);
          const edges = Array.from({ length: offsets[panel + 1]! - offsets[panel]! }, (_, index) => {
            const edge = offsets[panel]! + index,
              from = positions[edgeFrom[edge]!]!,
              to = positions[edgeTo[edge]!]!;
            return `<line x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}" stroke="#59605d" stroke-width=".65"/>`;
          }).join("");
          const nodes = positions
            .map(
              ([x, y]) =>
                `<circle cx="${x}" cy="${y}" r="1.7" fill="#2356c7" stroke="#fffdf7" stroke-width=".4"/>`,
            )
            .join("");
          return `<text x="${centerX - 27}" y="${centerY + 2}" font-size="7" font-weight="800">${label}</text>${edges}${nodes}`;
        })
        .join("")}`;
      break;
    }
    case "brief-event": {
      const duration = number(latent.videoDurationMs);
      const time = playhead * duration;
      const active =
        Boolean(latent.eventPresent) &&
        time >= number(latent.eventStartMs) &&
        time <= number(latent.eventStartMs) + number(latent.durationMs);
      body = videoStage(
        `<circle cx="${12 + playhead * 116}" cy="${50 + Math.sin(playhead * Math.PI * 4) * 22}" r="8" fill="${active ? palette.violet : palette.cobalt}"/>`,
      );
      break;
    }
    case "event-order": {
      const time = playhead * number(latent.videoDurationMs);
      const order = latent.order as string[];
      const first = Math.abs(time - number(latent.firstAtMs)) < 300;
      const second = Math.abs(time - number(latent.secondAtMs)) < 300;
      const squareActive = (first && order[0] === "square") || (second && order[1] === "square");
      const circleActive = (first && order[0] === "circle") || (second && order[1] === "circle");
      body = videoStage(
        `${shape("square", squareActive ? palette.citron : "#b7b5ab", 42, 50, 20)}${shape(
          "circle",
          circleActive ? palette.vermillion : "#b7b5ab",
          98,
          50,
          20,
        )}`,
      );
      break;
    }
    case "identity-occlusion": {
      const halfWindow = number(latent.occlusionHalfWindow);
      const behind = Math.abs(playhead - 0.5) < halfWindow;
      const progress = playhead < 0.5 ? playhead / 0.5 : (playhead - 0.5) / 0.5;
      const blueY = playhead < 0.5 ? 34 : Boolean(latent.swap) ? 67 : 33;
      const redY = playhead < 0.5 ? 66 : Boolean(latent.swap) ? 33 : 67;
      const x = playhead < 0.5 ? 10 + progress * 60 : 70 + progress * 60;
      body = videoStage(
        `${
          behind
            ? ""
            : `<circle cx="${x}" cy="${blueY}" r="7" fill="${palette.blue}"/><circle cx="${x}" cy="${redY}" r="7" fill="${palette.red}"/>`
        }<rect x="58" y="13" width="24" height="74" rx="3" fill="#252821"/>`,
      );
      break;
    }
    case "event-counting": {
      const time = playhead * number(latent.videoDurationMs);
      const count = number(latent.count);
      const interval = number(latent.intervalMs);
      const firstFlashAtMs = number(latent.firstFlashAtMs ?? 700);
      const active = Array.from({ length: count }, (_, index) => firstFlashAtMs + index * interval).some(
        (start) => time >= start && time < start + number(latent.flashDurationMs),
      );
      body = videoStage(
        `<circle cx="70" cy="50" r="22" fill="${active ? palette.citron : "#35382f"}"/><circle cx="70" cy="50" r="30" fill="none" stroke="${active ? palette.citron : "#6d6f66"}" opacity="${active ? 0.45 : 0.2}" stroke-width="2"/>`,
      );
      break;
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
      const cells = Array.from({ length: 36 }, (_, cell) => {
        const row = Math.floor(cell / 6);
        const column = cell % 6;
        const x = 31 + column * 13;
        const y = 17 + row * 11.5;
        const lit = activeCell === cell;
        return `<rect x="${x}" y="${y}" width="11" height="9" rx="1" fill="${lit ? gateColor : "#f5f2e9"}" stroke="#4b4e48" stroke-width=".45"/><text x="${x + 5.5}" y="${y + 6.2}" text-anchor="middle" font-size="3.2" font-weight="700" fill="${lit ? "#fff" : "#4b4e48"}">${String.fromCharCode(65 + column)}${row + 1}</text>`;
      }).join("");
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="9" text-anchor="middle" font-size="5" font-weight="700">EXACTLY TWICE · ONLY ${String(latent.targetGate)}</text><rect x="27" y="13" width="86" height="78" rx="4" fill="#fffdf7" stroke="${gateColor}" stroke-width="3"/>${cells}`;
      break;
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
      const event = active
        ? `<circle cx="${42 + approach * 20}" cy="50" r="12" fill="#2356c7"/><circle cx="${98 - approach * 20}" cy="50" r="12" fill="#f04b32"/><text x="${42 + approach * 20}" y="54" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${left[eventIndex]}</text><text x="${98 - approach * 20}" y="54" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${right[eventIndex]}</text>`
        : "";
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="11" text-anchor="middle" font-size="5" font-weight="700">COUNT ${(latent.targetPair as string[]).join("+")} · ONLY ${String(latent.targetGate)}</text><rect x="10" y="17" width="120" height="67" rx="5" fill="#fffdf7" stroke="${gateColor}" stroke-width="4"/>${event}`;
      break;
    }
    case "route-turn-integration": {
      const time = playhead * number(latent.videoDurationMs);
      const path = latent.path as number[];
      const stepCount = number(latent.stepCount);
      const localTime = time - 800;
      const step = Math.floor(localTime / 400);
      const bounded = Math.max(0, Math.min(stepCount - 1, step));
      const progress = Math.max(0, Math.min(1, (localTime - step * 400) / 320));
      const x = 22 + (path[bounded * 2]! + (path[(bounded + 1) * 2]! - path[bounded * 2]!) * progress) * 6.4;
      const y =
        17 +
        (path[bounded * 2 + 1]! + (path[(bounded + 1) * 2 + 1]! - path[bounded * 2 + 1]!) * progress) * 4.55;
      const grid = Array.from(
        { length: 16 },
        (_, index) =>
          `<line x1="${22 + index * 6.4}" x2="${22 + index * 6.4}" y1="15" y2="87" stroke="#171915" opacity=".16"/><line x1="20" x2="120" y1="${17 + index * 4.55}" y2="${17 + index * 4.55}" stroke="#171915" opacity=".16"/>`,
      ).join("");
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="8" text-anchor="middle" font-size="5" font-weight="700">COUNT DIRECTION CHANGES</text><rect x="18" y="13" width="104" height="76" fill="#fffdf7" stroke="#252821" stroke-width="1.2"/>${grid}<circle cx="${x}" cy="${y}" r="3.8" fill="#f4d934" stroke="#252821" stroke-width="1"/>`;
      break;
    }
    case "target-transition-count": {
      const time = playhead * number(latent.videoDurationMs);
      const sequence = latent.sequence as number[];
      const localTime = time - 800;
      const eventIndex = Math.floor(localTime / 360);
      const active = eventIndex >= 0 && eventIndex < sequence.length && localTime % 360 < 280;
      const value = active ? sequence[eventIndex] : -1;
      const symbol =
        value === 0
          ? `<circle cx="70" cy="57" r="15" fill="#2466cc"/>`
          : value === 1
            ? `<polygon points="70,40 53,72 87,72" fill="#f4d934"/>`
            : value === 2
              ? `<rect x="55" y="42" width="30" height="30" rx="2" fill="#df3c30"/>`
              : value === 3
                ? `<path d="M54 57H86M70 41V73" stroke="#9146c7" stroke-width="8"/>`
                : "";
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="8" text-anchor="middle" font-size="5" font-weight="700">COUNT BLUE CIRCLE → RED SQUARE</text>${symbol}<text x="70" y="91" text-anchor="middle" font-size="4.5" font-weight="700">${eventIndex < 0 ? "GET READY" : eventIndex < sequence.length ? `SYMBOL ${eventIndex + 1} / ${sequence.length}` : "SEQUENCE COMPLETE"}</text>`;
      break;
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
      for (let index = 0; index < Math.min(left.length, Math.max(0, activeIndex)); index += 1)
        [positions[left[index]!], positions[right[index]!]] = [
          positions[right[index]!]!,
          positions[left[index]!]!,
        ];
      const activeLeft = activeIndex >= 0 && activeIndex < left.length ? left[activeIndex]! : -1;
      const activeRight = activeIndex >= 0 && activeIndex < right.length ? right[activeIndex]! : -1;
      const slotX = [26, 55, 85, 114];
      const tokens = positions
        .map((identity, slot) => {
          const other = slot === activeLeft ? activeRight : slot === activeRight ? activeLeft : -1;
          const x = other < 0 ? slotX[slot]! : slotX[slot]! + (slotX[other]! - slotX[slot]!) * eased;
          const y = other < 0 ? 57 : 57 - Math.sin(Math.PI * eased) * (slot === activeLeft ? 13 : -9);
          const fill = identity === number(latent.initialTarget) && time < 900 ? "#e0a600" : "#59605d";
          return `<circle cx="${x}" cy="${y}" r="7" fill="${fill}" stroke="#252821" stroke-width="1"/>`;
        })
        .join("");
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="9" text-anchor="middle" font-size="5" font-weight="700">TRACK THE ORIGINAL GOLD TOKEN</text><line x1="13" x2="127" y1="71" y2="71" stroke="#252821" stroke-width="1.2"/>${tokens}${slotX.map((x, index) => `<text x="${x}" y="84" text-anchor="middle" font-size="7" font-weight="700">${index + 1}</text>`).join("")}`;
      break;
    }
    case "signed-state-accumulation": {
      const time = playhead * number(latent.videoDurationMs);
      const events = latent.events as number[];
      const localTime = time - 800;
      const eventIndex = Math.floor(localTime / 260);
      const active = eventIndex >= 0 && eventIndex < events.length && localTime % 260 < 210;
      const value = active ? events[eventIndex] : 0;
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="10" text-anchor="middle" font-size="5" font-weight="700">START AT ZERO · UPDATE EVERY EVENT</text><text x="70" y="63" text-anchor="middle" font-size="32" font-weight="800" fill="${value > 0 ? "#1d9b5f" : "#df3c30"}">${value > 0 ? "+1" : value < 0 ? "−1" : ""}</text><text x="70" y="90" text-anchor="middle" font-size="4.5" font-weight="700">${eventIndex < 0 ? "START AT 0" : eventIndex < events.length ? `EVENT ${eventIndex + 1} / ${events.length}` : "SEQUENCE COMPLETE"}</text>`;
      break;
    }
    case "zone-entry-count": {
      const duration = number(latent.videoDurationMs),
        time = playhead * duration,
        u = Math.max(0, Math.min(1, (time - number(latent.activeStartMs)) / number(latent.activeDurationMs))),
        targetX = 70 + 50 * Math.cos(Math.PI * 2 * number(latent.cycles) * u),
        distractorCount = number(latent.distractorCount);
      const distractors = Array.from(
        { length: distractorCount },
        (_, index) =>
          `<circle cx="${70 + Math.sin(playhead * Math.PI * (3 + index) + index) * 51}" cy="${28 + index * 9}" r="3.8" fill="${["#2356c7", "#168e88", "#8062d6", "#f04b32", "#59605d", "#d0a91f"][index]}" stroke="#252821" stroke-width=".5"/>`,
      ).join("");
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="9" text-anchor="middle" font-size="5" font-weight="700">COUNT RED-RINGED ENTRIES</text><rect x="8" y="15" width="124" height="72" rx="4" fill="#fffdf7" stroke="#252821" stroke-width="1"/><rect x="55" y="18" width="30" height="66" fill="#f4d934" opacity=".55" stroke="#d0a91f" stroke-width=".7"/>${distractors}<circle cx="${targetX}" cy="69" r="4.5" fill="${targetX >= 55 && targetX <= 85 ? "#e0a600" : "#59605d"}" stroke="#df3c30" stroke-width="2.2"/>`;
      break;
    }
    case "selective-flash-count": {
      const time = playhead * number(latent.videoDurationMs),
        flashObjects = latent.flashObjects as number[],
        flashStarts = latent.flashStarts as number[],
        objectCount = number(latent.distractorCount) + 1;
      const flashing = new Set(
        flashObjects.filter(
          (_, index) =>
            time >= flashStarts[index]! && time < flashStarts[index]! + number(latent.flashDurationMs),
        ),
      );
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="9" text-anchor="middle" font-size="5" font-weight="700">COUNT TARGET FLASHES ONLY</text>${Array.from(
        { length: objectCount },
        (_, object) => {
          const x = 16 + (0.5 - 0.5 * Math.cos((playhead * 2.5 + object / objectCount) * Math.PI * 2)) * 108,
            y =
              30 +
              object * (52 / Math.max(1, objectCount - 1)) +
              Math.sin(playhead * Math.PI * (3 + object)) * 7;
          return `<circle cx="${x}" cy="${y}" r="5" fill="${flashing.has(object) ? "#f4d934" : "#59605d"}" stroke="${object === 0 ? "#df3c30" : "#fffdf7"}" stroke-width="${object === 0 ? 2.5 : 0.7}"/>`;
        },
      ).join("")}`;
      break;
    }
    case "conservation-ledger": {
      const time = playhead * number(latent.videoDurationMs),
        from = latent.transferFrom as number[],
        to = latent.transferTo as number[],
        localTime = time - 1100,
        eventIndex = Math.floor(localTime / 650),
        phase = Math.max(0, Math.min(1, (localTime - eventIndex * 650) / 520)),
        positions = [
          [38, 36],
          [102, 36],
          [38, 72],
          [102, 72],
        ],
        active = eventIndex >= 0 && eventIndex < from.length,
        source = active ? positions[from[eventIndex]!]! : positions[0]!,
        destination = active ? positions[to[eventIndex]!]! : positions[0]!;
      const boxes = positions
        .map(
          ([x, y], box) =>
            `<rect x="${x - 17}" y="${y - 11}" width="34" height="22" rx="3" fill="#59605d" stroke="#252821" stroke-width=".8"/><text x="${x}" y="${y - 14}" text-anchor="middle" font-size="6" font-weight="800">${["A", "B", "C", "D"][box]}</text>${time < 1100 ? `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="9" font-weight="800" fill="#f4d934">${(latent.initialCounts as number[])[box]}</text>` : ""}`,
        )
        .join("");
      const transfer = active
        ? `<line x1="${source[0]}" y1="${source[1]}" x2="${destination[0]}" y2="${destination[1]}" stroke="#d0a91f" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="${source[0]! + (destination[0]! - source[0]!) * phase}" cy="${source[1]! + (destination[1]! - source[1]!) * phase}" r="3" fill="#f4d934" stroke="#252821" stroke-width=".6"/>`
        : "";
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="8" text-anchor="middle" font-size="5" font-weight="700">TRACK CONSERVED TOKENS</text>${boxes}${transfer}`;
      break;
    }
    case "trajectory-intersections": {
      const time = playhead * number(latent.videoDurationMs),
        path = latent.path as number[],
        segmentCount = number(latent.segmentCount),
        localTime = time - 800,
        segment = Math.floor(localTime / 520),
        bounded = Math.max(0, Math.min(segmentCount - 1, segment)),
        progress = Math.max(0, Math.min(1, (localTime - segment * 520) / 430)),
        x = 20 + (path[bounded * 2]! + (path[(bounded + 1) * 2]! - path[bounded * 2]!) * progress) * 8.5,
        y =
          12 +
          (path[bounded * 2 + 1]! + (path[(bounded + 1) * 2 + 1]! - path[bounded * 2 + 1]!) * progress) * 6.5;
      const grid = Array.from(
        { length: 12 },
        (_, index) =>
          `<line x1="${20 + index * 8.5}" x2="${20 + index * 8.5}" y1="12" y2="84" stroke="#252821" opacity=".13"/><line x1="20" x2="113.5" y1="${12 + index * 6.5}" y2="${12 + index * 6.5}" stroke="#252821" opacity=".13"/>`,
      ).join("");
      body = `<rect width="140" height="100" fill="#e8e5da"/><text x="70" y="8" text-anchor="middle" font-size="5" font-weight="700">COUNT TRUE SELF-CROSSINGS</text><rect x="17" y="10" width="106" height="80" fill="#fffdf7" stroke="#252821" stroke-width="1"/>${grid}<circle cx="${x}" cy="${y}" r="3.8" fill="#f4d934" stroke="#252821" stroke-width="1"/>`;
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 140 100">${body}</svg>`;
}
