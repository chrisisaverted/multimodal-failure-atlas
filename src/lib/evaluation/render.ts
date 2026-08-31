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
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 140 100">${body}</svg>`;
}
