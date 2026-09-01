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
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 140 100">${body}</svg>`;
}
